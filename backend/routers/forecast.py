from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

try:
    from backend.database import get_db
    from backend.calculations import generate_hourly_demand_forecast
    from backend.ingestion import resolve_store_id
except ImportError:
    from database import get_db
    from calculations import generate_hourly_demand_forecast
    from ingestion import resolve_store_id

router = APIRouter(prefix="/api/v1/forecast", tags=["Forecast"])

# Alias mapping for legacy demo SKU IDs to official dataset SKU IDs
SKU_LEGACY_MAP = {
    "SKU_COLD_DRINK_750ML": "Z001",
    "SKU_POTATO_CHIPS_CLASSIC": "Z009",
    "SKU_PACKAGED_WATER_1L": "Z004",
    "SKU_INSTANT_NOODLES": "Z040",
}

@router.get("/hourly")
async def get_hourly_forecast(
    store_id: str = Query(..., description="Store ID (e.g. STORE_007 or ZC-07)"),
    sku_id: str = Query(..., description="SKU ID (e.g. Z001 or SKU_COLD_DRINK_750ML)"),
    hours: Optional[int] = Query(12, description="Forecast horizon in hours"),
    db: Session = Depends(get_db)
):
    """
    Fetch hourly baseline vs event-adjusted demand curve for a dark store and SKU.
    Anchored to official reference snapshot time with category uplift calculations.
    """
    canonical_store = resolve_store_id(store_id)
    canonical_sku = SKU_LEGACY_MAP.get(sku_id, sku_id)

    forecast_data = generate_hourly_demand_forecast(
        db=db,
        store_id=canonical_store,
        sku_id=canonical_sku,
        hours=min(24, max(1, hours or 12))
    )

    # Preserve requested IDs for client compatibility
    forecast_data["requested_store_id"] = store_id
    forecast_data["requested_sku_id"] = sku_id
    return forecast_data
