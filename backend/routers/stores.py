from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from sqlalchemy import text

try:
    from backend.database import get_db
    from backend.models.store import Store
    from backend.models.inventory import StoreInventory
    from backend.models.sku import SKU
    from backend.ingestion import resolve_store_id, is_store_covered, to_dataset_store_id, STORE_MAPPING
except ImportError:
    from database import get_db
    from models.store import Store
    from models.inventory import StoreInventory
    from models.sku import SKU
    from ingestion import resolve_store_id, is_store_covered, to_dataset_store_id, STORE_MAPPING

router = APIRouter(prefix="/api/v1/stores", tags=["Stores"])

@router.get("")
async def list_stores(db: Session = Depends(get_db)):
    """List all stores with explicit official dataset coverage metadata."""
    stores = db.query(Store).order_by(Store.store_id).all()
    results = []
    for s in stores:
        covered = is_store_covered(s.store_id)
        results.append({
            "store_id": s.store_id,
            "store_name": s.store_name,
            "location_zone": s.location_zone,
            "stadium_proximity_km": s.stadium_proximity_km,
            "covered_by_dataset": covered,
            "dataset_store_code": to_dataset_store_id(s.store_id) if covered else None,
            "data_provenance": "OFFICIAL_DATASET" if covered else "UNCOVERED_STORE"
        })
    return {"total_stores": len(results), "stores": results}

@router.get("/{store_id}/inventory")
async def get_store_inventory(
    store_id: str,
    sku_id: Optional[str] = Query(None, description="SKU ID filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    db: Session = Depends(get_db)
):
    """Retrieve store stock levels, shelf slots, and physical capacities."""
    canonical_store = resolve_store_id(store_id)
    store = db.query(Store).filter(Store.store_id == canonical_store).first()
    covered = is_store_covered(canonical_store)

    query = """
        SELECT i.store_id, i.sku_id, s.sku_name, s.category, s.size,
               i.shelf_slot, i.shelf_stock_units, i.shelf_capacity_units,
               i.backroom_stock_units, i.total_stock_units,
               i.safety_stock_threshold_units, i.reorder_point_units,
               s.unit_selling_price_inr, s.unit_cost_price_inr, s.margin_pct
        FROM store_inventories i
        JOIN skus s ON i.sku_id = s.sku_id
        WHERE i.store_id = :store_id
    """
    params = {"store_id": canonical_store}

    if covered:
        query += " AND i.sku_id LIKE 'Z%'"

    if sku_id:
        # Check alias
        from backend.routers.forecast import SKU_LEGACY_MAP
        canon_sku = SKU_LEGACY_MAP.get(sku_id, sku_id)
        query += " AND i.sku_id = :sku_id"
        params["sku_id"] = canon_sku

    if category:
        query += " AND s.category = :category"
        params["category"] = category

    query += " ORDER BY s.category, s.sku_name"
    rows = db.execute(text(query), params).fetchall()

    skus_out = []
    for r in rows:
        shelf_stock = r[6]
        shelf_cap = r[7]
        safety = r[10]
        replenish_needed = shelf_stock < safety or shelf_stock == 0

        skus_out.append({
            "sku_id": r[1],
            "sku_name": r[2],
            "category": r[3],
            "size": r[4],
            "shelf_slot": r[5],
            "shelf_stock_units": shelf_stock,
            "shelf_capacity_units": shelf_cap,
            "backroom_stock_units": 0 if covered else r[8],
            "backroom_stock_unknown": True if covered else False,  # Official dataset does not provide backroom column
            "total_stock_units": shelf_stock if covered else r[9],
            "safety_stock_threshold_units": safety,
            "reorder_point_units": r[11],
            "unit_selling_price_inr": r[12],
            "unit_cost_price_inr": r[13],
            "margin_pct": r[14],
            "shelf_replenishment_needed": replenish_needed,
            "data_provenance": "OFFICIAL_DATASET" if covered else "UNCOVERED_STORE"
        })

    return {
        "store_id": canonical_store,
        "dataset_code": to_dataset_store_id(canonical_store),
        "store_name": store.store_name if store else f"Store {canonical_store}",
        "location_zone": store.location_zone if store else "Bangalore Central",
        "stadium_proximity_km": store.stadium_proximity_km if store else 1.4,
        "covered_by_dataset": covered,
        "data_provenance": "OFFICIAL_DATASET" if covered else "UNCOVERED_STORE",
        "total_skus": len(skus_out),
        "skus": skus_out
    }
