from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime

try:
    from backend.database import get_db
    from backend.ingestion import resolve_store_id, SNAPSHOT_REFERENCE_TIME
    from backend.calculations import generate_hourly_demand_forecast, get_sku_details
except ImportError:
    from database import get_db
    from ingestion import resolve_store_id, SNAPSHOT_REFERENCE_TIME
    from calculations import generate_hourly_demand_forecast, get_sku_details

router = APIRouter(prefix="/api/v1/simulation", tags=["Simulation"])

@router.post("/recalculate")
async def recalculate_simulation(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Run what-if scenario simulations with custom parameter overrides.
    Maintains independent Simulation Sandbox mode without overwriting live telemetry.
    """
    raw_store = payload.get("store_id", "STORE_007")
    raw_sku = payload.get("sku_id", "Z001")
    sim_params = payload.get("simulated_parameters", {})

    canonical_store = resolve_store_id(raw_store)
    from backend.routers.forecast import SKU_LEGACY_MAP
    canonical_sku = SKU_LEGACY_MAP.get(raw_sku, raw_sku)

    # Base forecast for reference
    fc = generate_hourly_demand_forecast(db, canonical_store, canonical_sku, hours=6)
    intervals = fc.get("forecast_intervals", [])
    total_proj = sum(inv["final_projected_demand_units"] for inv in intervals)

    # Simulate parameter overrides (e.g. higher match uplift or delayed truck arrival)
    sim_uplift_multiplier = sim_params.get("event_uplift_multiplier", 1.0)
    sim_demand = round(total_proj * sim_uplift_multiplier) if sim_uplift_multiplier else total_proj

    sim_recs = [
        {
            "recommendation_id": f"SIM_REC_{canonical_store}_TRF",
            "option_type": "TRANSFER",
            "title": f"Simulated Inter-Store Stock Transfer",
            "recommended_quantity_units": min(30, max(10, sim_demand // 3)),
            "simulated_demand_units": sim_demand,
            "stockout_prevented": True,
            "cost_inr": 120.0
        },
        {
            "recommendation_id": f"SIM_REC_{canonical_store}_WH",
            "option_type": "EARLIER_TRUCK",
            "title": f"Simulated Expedited Warehouse Freight",
            "recommended_quantity_units": min(100, max(25, sim_demand)),
            "simulated_demand_units": sim_demand,
            "stockout_prevented": True,
            "cost_inr": 350.0
        }
    ]

    return {
        "simulation_id": f"SIM_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        "store_id": canonical_store,
        "sku_id": canonical_sku,
        "mode": "SIMULATION_SANDBOX",
        "reference_time": SNAPSHOT_REFERENCE_TIME.isoformat() + "Z",
        "simulated_at": datetime.utcnow().isoformat() + "Z",
        "applied_parameters": sim_params,
        "simulated_projected_demand": sim_demand,
        "simulated_recommendations": sim_recs
    }
