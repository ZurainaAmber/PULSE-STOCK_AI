"""
PulseStock AI - Authoritative Calculation Engine
Drives Live Mode operational calculations from official hackathon dataset.
"""

from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.ingestion import (
    SNAPSHOT_REFERENCE_TIME,
    STORE_MAPPING,
    REVERSE_STORE_MAPPING,
    resolve_store_id,
    to_dataset_store_id,
    is_store_covered,
)


def get_hourly_order_history(db: Session, store_id: str, sku_id: str) -> Dict[int, List[int]]:
    """
    Calculate hourly order quantities per hour-of-day (0 to 23) across historical dates.
    Missing hour for a SKU on an active date is counted as 0 orders.
    """
    canonical_store = resolve_store_id(store_id)
    
    # Get all distinct order dates in dataset
    date_rows = db.execute(text("""
        SELECT DISTINCT DATE(timestamp) as dt FROM orders
        WHERE store_id = :store_id
    """), {"store_id": canonical_store}).fetchall()
    
    unique_dates = [r[0] for r in date_rows]
    if not unique_dates:
        return {h: [0] for h in range(24)}

    # Get actual order records for this (store, sku)
    order_rows = db.execute(text("""
        SELECT DATE(timestamp) as dt, CAST(strftime('%H', timestamp) AS INTEGER) as hr, SUM(quantity) as qty
        FROM orders
        WHERE store_id = :store_id AND sku_id = :sku_id
        GROUP BY DATE(timestamp), strftime('%H', timestamp)
    """), {"store_id": canonical_store, "sku_id": sku_id}).fetchall()

    qty_map = {(r[0], r[1]): r[2] for r in order_rows}

    # Operating hours are typically 07:00 to 23:00
    hourly_history: Dict[int, List[int]] = {h: [] for h in range(24)}
    for dt in unique_dates:
        for h in range(24):
            # If date is the snapshot date (2026-11-16) and hour >= 16, do not include in past history
            if dt == "2026-11-16" and h >= 16:
                continue
            qty = qty_map.get((dt, h), 0)
            hourly_history[h].append(qty)

    return hourly_history


def get_sku_details(db: Session, sku_id: str) -> Optional[Dict[str, Any]]:
    """Fetch SKU information from catalogue."""
    row = db.execute(text("""
        SELECT sku_id, sku_name, category, size, unit_selling_price_inr, margin_pct, unit_cost_price_inr
        FROM skus WHERE sku_id = :sku_id
    """), {"sku_id": sku_id}).fetchone()
    if not row:
        return None
    return {
        "sku_id": row[0],
        "sku_name": row[1],
        "category": row[2],
        "size": row[3],
        "unit_selling_price_inr": row[4],
        "margin_pct": row[5],
        "unit_cost_price_inr": row[6],
    }


def get_active_events_for_time(db: Session, target_dt: datetime) -> List[Dict[str, Any]]:
    """Fetch all external events active at target_dt."""
    rows = db.execute(text("""
        SELECT event_id, event_type, title, affected_category, multiplier, expected_uplift, start_time, end_time
        FROM external_events
        WHERE :target_dt BETWEEN start_time AND end_time
    """), {"target_dt": target_dt}).fetchall()
    
    events = []
    for r in rows:
        events.append({
            "event_id": r[0],
            "event_type": r[1],
            "title": r[2],
            "affected_category": r[3],
            "multiplier": r[4],
            "expected_uplift": r[5] if r[5] is not None else (r[4] - 1.0),
            "start_time": r[6],
            "end_time": r[7],
        })
    return events


def generate_hourly_demand_forecast(
    db: Session,
    store_id: str,
    sku_id: str,
    hours: int = 12,
    ref_time: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Generate baseline and event-adjusted hourly demand forecast using official orders.csv & events.csv.
    """
    if ref_time is None:
        ref_time = SNAPSHOT_REFERENCE_TIME

    canonical_store = resolve_store_id(store_id)
    is_covered = is_store_covered(canonical_store)

    sku_info = get_sku_details(db, sku_id)
    sku_category = sku_info["category"] if sku_info else "Unknown"

    if not is_covered:
        return {
            "store_id": canonical_store,
            "sku_id": sku_id,
            "generated_at": ref_time.isoformat() + "Z",
            "data_provenance": "UNCOVERED_STORE",
            "coverage": False,
            "message": f"Store '{canonical_store}' is not covered by the official dark store dataset.",
            "forecast_intervals": []
        }

    hourly_history = get_hourly_order_history(db, canonical_store, sku_id)
    forecast_intervals = []

    for i in range(hours):
        interval_dt = ref_time + timedelta(hours=i)
        hr = interval_dt.hour
        hour_label = f"{interval_dt.strftime('%H:00')} - {(interval_dt + timedelta(hours=1)).strftime('%H:00')}"

        # Baseline demand: average historical orders at this hour of day
        hist_vals = hourly_history.get(hr, [0])
        baseline_rate = sum(hist_vals) / len(hist_vals) if hist_vals else 0.0
        # If dark store is closed (midnight to 06:00), zero demand
        if hr < 7:
            baseline_units = 0
        else:
            baseline_units = max(1, round(baseline_rate)) if baseline_rate > 0.4 else round(baseline_rate)

        # Check events for this interval
        events = get_active_events_for_time(db, interval_dt)
        cricket_uplift_units = 0
        rain_uplift_units = 0
        festival_uplift_units = 0

        for evt in events:
            aff_cat = evt["affected_category"]
            uplift_fraction = evt["expected_uplift"]
            # Apply only if category matches or category is 'All'
            if aff_cat == "All" or aff_cat.lower() == sku_category.lower():
                uplift_qty = round(baseline_units * uplift_fraction)
                if evt["event_type"] == "CRICKET":
                    cricket_uplift_units += uplift_qty
                elif evt["event_type"] in ("RAIN", "WEATHER"):
                    rain_uplift_units += uplift_qty
                else:
                    festival_uplift_units += uplift_qty

        final_projected = baseline_units + cricket_uplift_units + rain_uplift_units + festival_uplift_units
        lower_bound = max(0, round(final_projected * 0.85))
        upper_bound = round(final_projected * 1.18)

        forecast_intervals.append({
            "timestamp": interval_dt.strftime("%Y-%m-%dT%H:00:00Z"),
            "hour_label": hour_label,
            "baseline_demand_units": baseline_units,
            "cricket_uplift_units": cricket_uplift_units,
            "rain_uplift_units": rain_uplift_units,
            "festival_uplift_units": festival_uplift_units,
            "final_projected_demand_units": final_projected,
            "confidence_lower_bound": lower_bound,
            "confidence_upper_bound": upper_bound
        })

    return {
        "store_id": canonical_store,
        "sku_id": sku_id,
        "sku_name": sku_info["sku_name"] if sku_info else sku_id,
        "category": sku_category,
        "generated_at": ref_time.isoformat() + "Z",
        "data_provenance": "OFFICIAL_DATASET",
        "coverage": True,
        "forecast_intervals": forecast_intervals
    }


def calculate_stockout_alerts_live(
    db: Session,
    store_id: Optional[str] = None,
    time_horizon_hours: int = 4
) -> List[Dict[str, Any]]:
    """
    Detect genuine stockout risks at snapshot time (2026-11-16 16:00) using real inventory and forecast.
    """
    ref_time = SNAPSHOT_REFERENCE_TIME
    canonical_store = resolve_store_id(store_id) if store_id else None

    # Query inventory for covered stores
    query = """
        SELECT i.store_id, i.sku_id, i.shelf_stock_units, i.shelf_capacity_units,
               i.backroom_stock_units, s.sku_name, s.category, st.store_name
        FROM store_inventories i
        JOIN skus s ON i.sku_id = s.sku_id
        JOIN stores st ON i.store_id = st.store_id
    """
    params = {}
    if canonical_store:
        query += " WHERE i.store_id = :store_id"
        params["store_id"] = canonical_store
    
    rows = db.execute(text(query), params).fetchall()
    alerts = []

    for r in rows:
        st_id, sku_id, shelf_stock, shelf_cap, backroom, sku_name, category, store_name = r
        if not is_store_covered(st_id):
            continue

        # Get projected demand for next 4 hours
        fc = generate_hourly_demand_forecast(db, st_id, sku_id, hours=time_horizon_hours, ref_time=ref_time)
        intervals = fc.get("forecast_intervals", [])
        total_4hr_demand = sum(inv["final_projected_demand_units"] for inv in intervals)
        hourly_demand = round(total_4hr_demand / max(1, len(intervals)))

        # Immediate stockout if shelf is 0
        if shelf_stock == 0:
            minutes_left = 0
            severity = "CRITICAL"
        elif hourly_demand > 0 and shelf_stock < total_4hr_demand:
            minutes_left = max(1, round((shelf_stock / hourly_demand) * 60))
            if minutes_left <= 60:
                severity = "CRITICAL"
            elif minutes_left <= 120:
                severity = "HIGH"
            else:
                severity = "MEDIUM"
        else:
            continue  # Stock is sufficient for the window

        est_stockout_dt = ref_time + timedelta(minutes=minutes_left)
        alert_id = f"ALT_{ref_time.strftime('%Y%m%d')}_{st_id}_{sku_id}"

        # Primary demand driver
        driver = "EVENT_UPLIFT_MATCH" if category in ("Beverages", "Snacks") else "PEAK_EVENING_DEMAND"

        alerts.append({
            "alert_id": alert_id,
            "store_id": st_id,
            "store_name": store_name,
            "sku_id": sku_id,
            "sku_name": sku_name,
            "category": category,
            "severity": severity,
            "current_total_stock_units": shelf_stock,  # Backroom is unknown from official CSV
            "shelf_stock_units": shelf_stock,
            "backroom_stock_units": 0,
            "backroom_stock_unknown": True,
            "projected_hourly_demand_units": hourly_demand,
            "stockout_probability": 0.98 if shelf_stock == 0 else min(0.95, round(1.0 - (shelf_stock / max(1, total_4hr_demand)), 2)),
            "minutes_until_stockout": minutes_left,
            "estimated_stockout_timestamp": est_stockout_dt.strftime("%Y-%m-%dT%H:%M:00Z"),
            "primary_driver": driver,
            "status": "PENDING",
            "data_provenance": "OFFICIAL_DATASET"
        })

    # Sort alerts by severity (CRITICAL first, then lowest minutes left)
    severity_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    alerts.sort(key=lambda a: (severity_rank.get(a["severity"], 4), a["minutes_until_stockout"]))
    return alerts


def calculate_warehouse_replenishment_recommendation(
    db: Session,
    alert: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Generate constrained operational replenishment recommendations for an alert.
    Ensures warehouse allocation does NOT exceed available stock in warehouse_stock.csv!
    """
    sku_id = alert["sku_id"]
    store_id = alert["store_id"]
    shelf_stock = alert["shelf_stock_units"]
    hourly_demand = alert["projected_hourly_demand_units"]

    # Check warehouse availability
    wh_row = db.execute(text("""
        SELECT available_stock_units, free_stock_units FROM warehouse_stock
        WHERE sku_id = :sku_id
    """), {"sku_id": sku_id}).fetchone()

    wh_free_stock = wh_row[1] if wh_row else 0

    # Deficit to cover next 6 hours of match demand
    target_units = max(20, hourly_demand * 5)
    allocated_units = min(target_units, wh_free_stock)

    recommendations = []

    # Option 1: Expedited Warehouse Truck Dispatch (if WH has stock)
    if allocated_units > 0:
        recommendations.append({
            "recommendation_id": f"REC_{store_id}_WH_{sku_id}",
            "alert_id": alert["alert_id"],
            "option_type": "EARLIER_TRUCK",
            "title": f"Expedited Warehouse Dispatch for {alert['sku_name']}",
            "description": f"Allocate {allocated_units} units from Central Hub (available: {wh_free_stock} units).",
            "recommended_quantity_units": allocated_units,
            "warehouse_stock_available": wh_free_stock,
            "warehouse_constraint_satisfied": True,
            "transit_time_minutes": 35,
            "execution_cost_inr": 350.0,
            "stockout_prevented": True,
            "is_feasible": True,
            "actionability": "ACTIONABLE"
        })

    # Option 2: Inter-Store Stock Transfer from Candidate Donor Store
    donor_row = db.execute(text("""
        SELECT i.store_id, st.store_name, i.shelf_stock_units
        FROM store_inventories i
        JOIN stores st ON i.store_id = st.store_id
        WHERE i.sku_id = :sku_id AND i.store_id != :store_id AND i.shelf_stock_units > 15
        ORDER BY i.shelf_stock_units DESC
        LIMIT 1
    """), {"sku_id": sku_id, "store_id": store_id}).fetchone()

    if donor_row:
        donor_id, donor_name, donor_stock = donor_row
        transfer_qty = min(15, donor_stock - 5)
        if transfer_qty > 0:
            recommendations.append({
                "recommendation_id": f"REC_{store_id}_TRF_{donor_id}",
                "alert_id": alert["alert_id"],
                "option_type": "TRANSFER",
                "title": f"Hyper-Local Transfer from {donor_name}",
                "description": f"Request {transfer_qty} units from {donor_name} via delivery rider.",
                "donor_store_id": donor_id,
                "donor_store_name": donor_name,
                "recommended_quantity_units": transfer_qty,
                "transit_time_minutes": 20,
                "execution_cost_inr": 120.0,
                "stockout_prevented": True,
                "is_feasible": True,
                "actionability": "ACTIONABLE"
            })

    # Option 3: Wait for Scheduled Truck (from truck_schedule.csv at 21:00)
    recommendations.append({
        "recommendation_id": f"REC_{store_id}_WAIT_{sku_id}",
        "alert_id": alert["alert_id"],
        "option_type": "WAIT",
        "title": "Wait for Scheduled Delivery Slot",
        "description": "Standard delivery truck scheduled at 21:00 (capacity: 400 units).",
        "recommended_quantity_units": 0,
        "transit_time_minutes": 300,
        "execution_cost_inr": 0.0,
        "stockout_prevented": False,  # Arrives after match starts at 19:30
        "is_feasible": True,
        "actionability": "PASSIVE"
    })

    return recommendations
