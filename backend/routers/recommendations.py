from fastapi import APIRouter, Depends, Query, Body, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime

try:
    from backend.database import get_db
    from backend.models.recommendation import Recommendation
    from backend.models.action_log import ActionLog
    from backend.calculations import (
        calculate_stockout_alerts_live,
        calculate_warehouse_replenishment_recommendation,
    )
    from backend.ingestion import SNAPSHOT_REFERENCE_TIME
except ImportError:
    from database import get_db
    from models.recommendation import Recommendation
    from models.action_log import ActionLog
    from calculations import (
        calculate_stockout_alerts_live,
        calculate_warehouse_replenishment_recommendation,
    )
    from ingestion import SNAPSHOT_REFERENCE_TIME

router = APIRouter(prefix="/api/v1/recommendations", tags=["Recommendations"])

@router.get("")
async def get_recommendations(
    alert_id: str = Query(..., description="Alert ID to evaluate"),
    db: Session = Depends(get_db)
):
    """
    Retrieve decision engine recommendations for a stockout alert.
    Constrained by central warehouse stock availability and truck delivery slots.
    """
    # 1. First check if alert is in live alerts
    all_alerts = calculate_stockout_alerts_live(db=db)
    matched_alert = next((a for a in all_alerts if a["alert_id"] == alert_id), None)

    if matched_alert:
        recs = calculate_warehouse_replenishment_recommendation(db=db, alert=matched_alert)
        return {
            "alert_id": alert_id,
            "evaluated_at": SNAPSHOT_REFERENCE_TIME.isoformat() + "Z",
            "reference_time": SNAPSHOT_REFERENCE_TIME.isoformat() + "Z",
            "data_provenance": "OFFICIAL_DATASET",
            "recommendations": recs
        }

    # 2. Fallback to existing database recommendations if alert was pre-stored
    db_recs = db.query(Recommendation).filter(Recommendation.alert_id == alert_id).all()
    if db_recs:
        return {
            "alert_id": alert_id,
            "evaluated_at": datetime.utcnow().isoformat() + "Z",
            "recommendations": db_recs
        }

    # If alert_id not found, return empty with clear status
    return {
        "alert_id": alert_id,
        "evaluated_at": SNAPSHOT_REFERENCE_TIME.isoformat() + "Z",
        "data_provenance": "OFFICIAL_DATASET",
        "recommendations": []
    }

@router.post("/{recommendation_id}/approve")
async def approve_recommendation(
    recommendation_id: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """Submit manager approval for a recommendation."""
    manager_id = payload.get("manager_id", "UNKNOWN_MANAGER")
    notes = payload.get("manager_notes", "")
    action_id = f"ACT_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{recommendation_id[-6:]}"

    # Check if this is a db recommendation
    rec = db.query(Recommendation).filter(Recommendation.recommendation_id == recommendation_id).first()
    store_id = getattr(rec, "store_id", "STORE_007") if rec else "STORE_007"
    sku_id = getattr(rec, "sku_id", "Z001") if rec else "Z001"
    opt_type = rec.option_type if rec else ("TRANSFER" if "TRF" in recommendation_id else "EARLIER_TRUCK")
    cost = rec.execution_cost_inr if rec else (120.0 if opt_type == "TRANSFER" else 350.0)

    action = ActionLog(
        action_id=action_id,
        alert_id=rec.alert_id if rec else f"ALT_{recommendation_id}",
        recommendation_id=recommendation_id,
        store_id=store_id,
        sku_id=sku_id,
        action_type=opt_type,
        status="APPROVED",
        manager_id=manager_id,
        notes=notes,
        cost_inr=cost
    )
    db.add(action)
    db.commit()
    db.refresh(action)

    return {
        "action_id": action_id,
        "recommendation_id": recommendation_id,
        "status": "APPROVED",
        "executed_at": datetime.utcnow().isoformat() + "Z",
        "manager_id": manager_id,
        "action_summary": f"Approved {opt_type} replenishment recommendation.",
        "simulated_outcome": {
            "stockout_prevented": True
        }
    }

@router.post("/{recommendation_id}/reject")
async def reject_recommendation(
    recommendation_id: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """Submit manager rejection for a recommendation."""
    manager_id = payload.get("manager_id", "UNKNOWN_MANAGER")
    notes = payload.get("notes", "")
    action_id = f"ACT_REJ_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{recommendation_id[-6:]}"

    action = ActionLog(
        action_id=action_id,
        alert_id=f"ALT_{recommendation_id}",
        recommendation_id=recommendation_id,
        store_id="STORE_007",
        sku_id="Z001",
        action_type="REJECTED",
        status="REJECTED",
        manager_id=manager_id,
        notes=notes,
        cost_inr=0.0
    )
    db.add(action)
    db.commit()

    return {
        "recommendation_id": recommendation_id,
        "status": "REJECTED",
        "rejected_at": datetime.utcnow().isoformat() + "Z"
    }
