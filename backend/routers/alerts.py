from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

try:
    from backend.database import get_db
    from backend.models.alert import StockoutAlert
    from backend.calculations import calculate_stockout_alerts_live
    from backend.ingestion import resolve_store_id, is_store_covered, SNAPSHOT_REFERENCE_TIME
except ImportError:
    from database import get_db
    from models.alert import StockoutAlert
    from calculations import calculate_stockout_alerts_live
    from ingestion import resolve_store_id, is_store_covered, SNAPSHOT_REFERENCE_TIME

router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts"])

@router.get("/stockouts")
async def get_stockout_alerts(
    store_id: Optional[str] = Query(None, description="Filter by store ID (e.g. STORE_007 or ZC-07)"),
    min_severity: Optional[str] = Query("LOW", description="Minimum alert severity"),
    time_horizon_hours: Optional[int] = Query(4, description="Projection window in hours"),
    db: Session = Depends(get_db)
):
    """List active stock-out alerts driven by official store inventory and projected match demand."""
    canonical_store = resolve_store_id(store_id) if store_id else None

    # Calculate live alerts from official dataset
    live_alerts = calculate_stockout_alerts_live(
        db=db,
        store_id=canonical_store,
        time_horizon_hours=time_horizon_hours or 4
    )

    # Filter by min_severity if provided
    severity_order = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1, "LOW": 0}
    min_threshold = severity_order.get((min_severity or "LOW").upper(), 0)
    filtered = [a for a in live_alerts if severity_order.get(a["severity"], 0) >= min_threshold]

    return {
        "timestamp": SNAPSHOT_REFERENCE_TIME.isoformat() + "Z",
        "reference_time": SNAPSHOT_REFERENCE_TIME.isoformat() + "Z",
        "data_provenance": "OFFICIAL_DATASET",
        "total_alerts": len(filtered),
        "alerts": filtered
    }

@router.get("/stockouts/{alert_id}")
async def get_stockout_alert_detail(
    alert_id: str,
    db: Session = Depends(get_db)
):
    """Fetch single stock-out alert by ID."""
    # Check live alerts first
    all_alerts = calculate_stockout_alerts_live(db=db)
    for a in all_alerts:
        if a["alert_id"] == alert_id:
            return a

    # Fallback to database table if stored
    alert = db.query(StockoutAlert).filter(StockoutAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(
            status_code=404,
            detail=f"Stockout alert with ID '{alert_id}' was not found."
        )
    return alert
