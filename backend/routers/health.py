from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
try:
    from backend.database import get_db
    from backend.schemas.health import HealthResponse
except ImportError:
    from database import get_db
    from schemas.health import HealthResponse

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
@router.get("/api/v1/health", response_model=HealthResponse)
async def check_health(db: Session = Depends(get_db)):
    """Health check endpoint to verify backend service and SQLite database connection."""
    db_status = "connected"
    try:
        # Simple lightweight DB connectivity check
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"

    return HealthResponse(
        status="ok" if db_status == "connected" else "degraded",
        service="PulseStock AI Backend",
        database=db_status,
        timestamp=datetime.utcnow()
    )

@router.get("/api/v1/dataset/info")
async def get_dataset_info(db: Session = Depends(get_db)):
    """Return provenance metadata regarding the ingested official hackathon dataset."""
    from backend.ingestion import SNAPSHOT_REFERENCE_TIME, STORE_MAPPING, UNCOVERED_STORES
    
    sku_count = db.execute(text("SELECT count(*) FROM skus WHERE sku_id LIKE 'Z%'")).fetchone()[0]
    inv_count = db.execute(text("SELECT count(*) FROM store_inventories WHERE data_provenance = 'OFFICIAL_DATASET'")).fetchone()[0]
    order_count = db.execute(text("SELECT count(*) FROM orders WHERE store_id IN ('" + "','".join(STORE_MAPPING.values()) + "')")).fetchone()[0]
    
    return {
        "scenario": "Challenge 06 – Before the Match Starts (Zipcart)",
        "reference_time": SNAPSHOT_REFERENCE_TIME.isoformat() + "Z",
        "data_provenance": "OFFICIAL_DATASET",
        "covered_stores_count": len(STORE_MAPPING),
        "covered_stores": STORE_MAPPING,
        "uncovered_stores_count": len(UNCOVERED_STORES),
        "uncovered_stores": UNCOVERED_STORES,
        "catalogue_skus_count": sku_count,
        "official_inventory_records": inv_count,
        "official_order_records": order_count
    }

