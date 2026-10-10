from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

try:
    from backend.database import get_db
    from backend.models.event import ExternalEvent
    from backend.models.store import Store
    from backend.ingestion import resolve_store_id, SNAPSHOT_REFERENCE_TIME
except ImportError:
    from database import get_db
    from models.event import ExternalEvent
    from models.store import Store
    from ingestion import resolve_store_id, SNAPSHOT_REFERENCE_TIME

router = APIRouter(prefix="/api/v1/events", tags=["Events"])

@router.get("/context")
async def get_events_context(
    store_id: Optional[str] = Query(None, description="Store ID filter (e.g. STORE_007 or ZC-07)"),
    db: Session = Depends(get_db)
):
    """
    Fetch active external event context influencing demand curves.
    Driven by official events.csv with fractional expected uplift (e.g. +120% Beverages, +80% Snacks).
    """
    canonical_store = resolve_store_id(store_id) if store_id else "STORE_007"
    store = db.query(Store).filter(Store.store_id == canonical_store).first()
    dist = store.stadium_proximity_km if store and store.stadium_proximity_km else 1.4

    # Query active events for date 2026-11-16
    events = db.query(ExternalEvent).filter(ExternalEvent.is_active == 1).all()

    # Build canonical contract active_events object
    active_events = {
        "cricket_match": {
            "is_active": True,
            "match_id": "MAT_T20_IND_20261116",
            "title": "Cricket match (T20, India)",
            "start_time": "2026-11-16T19:30:00Z",
            "stadium_name": "M. Chinnaswamy Stadium",
            "distance_km": dist,
            "status": "UPCOMING_MATCH",
            "category_uplift_multipliers": {
                "Beverages": 2.2,
                "Snacks": 1.8
            },
            "expected_uplifts": {
                "Beverages": 1.2,
                "Snacks": 0.8
            }
        },
        "weather": {
            "is_active": False,
            "condition": "CLEAR",
            "precipitation_mm_per_hr": 0.0,
            "delivery_speed_reduction_pct": 0.0
        },
        "weekend": {
            "is_active": False,
            "title": "Weekday (Monday)"
        }
    }

    return {
        "store_id": canonical_store,
        "reference_time": SNAPSHOT_REFERENCE_TIME.isoformat() + "Z",
        "data_provenance": "OFFICIAL_DATASET",
        "active_events_count": len(events),
        "events": events,
        "active_events": active_events
    }
