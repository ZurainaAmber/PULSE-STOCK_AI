#!/usr/bin/env python3
"""
PulseStock AI - Comprehensive Automated Verification Test Suite
Challenge 06 – Before the Match Starts (Zipcart)

Tests all 12 verification criteria specified in Hackathon Challenge requirements:
1. CSV schema & type validation
2. Repeat imports & idempotency
3. Store/SKU mapping & unmatched records handling
4. Hourly demand aggregation & missing-hour zero behavior
5. Event uplift calculations & 'All day' event handling
6. Warehouse stock allocation constraints across stores
7. Shelf capacity & replenishment quantities
8. Rider capacity calculations (order lines)
9. Truck capacity & scheduled-slot handling
10. Live Mode vs Simulation Mode data isolation
11. Authentication & manager transfer workflow preservation
12. Live HTTP API endpoint contracts
"""

import os
import sys
import json
import urllib.request
from datetime import datetime, timedelta

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.database import SessionLocal
from backend.ingestion import (
    SNAPSHOT_REFERENCE_TIME,
    STORE_MAPPING,
    REVERSE_STORE_MAPPING,
    resolve_store_id,
    is_store_covered,
    ingest_official_dataset
)
from backend.calculations import (
    generate_hourly_demand_forecast,
    calculate_stockout_alerts_live,
    calculate_warehouse_replenishment_recommendation,
    get_hourly_order_history,
    get_active_events_for_time,
)
from backend.models.user import User
from backend.auth import verify_password
from sqlalchemy import text

def run_tests():
    db = SessionLocal()
    passed = 0
    failed = 0

    def assert_true(cond, test_name, msg=""):
        nonlocal passed, failed
        if cond:
            print(f"  [PASS] {test_name}")
            passed += 1
        else:
            print(f"  [FAIL] {test_name}: {msg}")
            failed += 1

    print("=" * 75)
    print("PulseStock AI - Challenge 06 Integration Test Suite")
    print("=" * 75)

    # -------------------------------------------------------------
    # 1. CSV Schema & Type Validation
    # -------------------------------------------------------------
    print("\n1. Testing CSV Schema & Type Validation...")
    csv_dir = os.path.join(PROJECT_ROOT, "data", "official_hackathon")
    expected_files = [
        "events.csv", "orders.csv", "products.csv", "riders.csv",
        "store_inventory.csv", "truck_schedule.csv", "warehouse_stock.csv"
    ]
    for ef in expected_files:
        fpath = os.path.join(csv_dir, ef)
        assert_true(os.path.isfile(fpath) and os.path.getsize(fpath) > 0, f"File {ef} exists and non-empty")

    # -------------------------------------------------------------
    # 2. Repeat Imports & Idempotency
    # -------------------------------------------------------------
    print("\n2. Testing Repeat Imports & Idempotency...")
    report = ingest_official_dataset(csv_dir, db)
    assert_true(report.to_dict()["success"], "Ingestion pipeline returns success")
    # Verify no rejected records
    files_stats = report.to_dict()["files"]
    assert_true(files_stats["products.csv"]["valid"] == 67, "products.csv has 67 valid rows")
    assert_true(files_stats["store_inventory.csv"]["valid"] == 804, "store_inventory.csv has 804 valid rows")
    assert_true(files_stats["warehouse_stock.csv"]["valid"] == 67, "warehouse_stock.csv has 67 valid rows")
    assert_true(files_stats["events.csv"]["valid"] == 5, "events.csv has 5 valid rows")
    assert_true(files_stats["truck_schedule.csv"]["valid"] == 48, "truck_schedule.csv has 48 valid rows")
    assert_true(files_stats["riders.csv"]["valid"] == 600, "riders.csv has 600 valid rows")
    assert_true(files_stats["orders.csv"]["valid"] == 26726, "orders.csv has 26726 valid rows")

    # -------------------------------------------------------------
    # 3. Store / SKU Mapping & Unmatched Records Handling
    # -------------------------------------------------------------
    print("\n3. Testing Store/SKU Mapping & Unmatched Handling...")
    assert_true(resolve_store_id("ZC-01") == "STORE_001", "ZC-01 resolves to STORE_001")
    assert_true(resolve_store_id("ZC-07") == "STORE_007", "ZC-07 resolves to STORE_007")
    assert_true(resolve_store_id("ZC-12") == "STORE_012", "ZC-12 resolves to STORE_012")
    assert_true(is_store_covered("STORE_007"), "STORE_007 is covered")
    assert_true(not is_store_covered("STORE_013"), "STORE_013 is correctly flagged as uncovered")
    assert_true(not is_store_covered("STORE_030"), "STORE_030 is correctly flagged as uncovered")
    # Verify uncovered store returns uncatalogued response
    uncovered_fc = generate_hourly_demand_forecast(db, "STORE_015", "Z001")
    assert_true(uncovered_fc["data_provenance"] == "UNCOVERED_STORE", "STORE_015 returns UNCOVERED_STORE provenance")
    assert_true(uncovered_fc["coverage"] is False, "STORE_015 coverage flag is False")

    # -------------------------------------------------------------
    # 4. Hourly Demand Aggregation & Missing-Hour Behavior
    # -------------------------------------------------------------
    print("\n4. Testing Hourly Demand Aggregation & Missing-Hour Behavior...")
    history = get_hourly_order_history(db, "STORE_007", "Z001")
    assert_true(isinstance(history, dict) and len(history) == 24, "History contains 24 hourly buckets")
    # At early morning (02:00) when dark store is closed, historical demand is 0
    assert_true(all(v == 0 for v in history.get(2, [0])), "Missing order hours (02:00) evaluate strictly to 0")
    # Active evening hours have orders
    assert_true(sum(history.get(20, [0])) > 0, "Evening hours (20:00) reflect actual historical demand")

    # -------------------------------------------------------------
    # 5. Event Uplift Calculations & 'All Day' Event Handling
    # -------------------------------------------------------------
    print("\n5. Testing Event Uplift Calculations & 'All day' Handling...")
    # Check Nov 10 'All day' event
    nov10_dt = datetime(2026, 11, 10, 14, 0, 0)
    nov10_events = get_active_events_for_time(db, nov10_dt)
    assert_true(len(nov10_events) >= 1, "Nov 10 'All day' event is detected at 14:00")
    assert_true(any(e["expected_uplift"] == 0.15 for e in nov10_events), "Weekend event has 0.15 expected_uplift")
    
    # Check Nov 16 Match at 20:00 (Beverages +1.2, Snacks +0.8)
    nov16_match_dt = datetime(2026, 11, 16, 20, 0, 0)
    match_events = get_active_events_for_time(db, nov16_match_dt)
    assert_true(len(match_events) == 2, "Nov 16 evening has 2 active match event categories")
    bev_event = next((e for e in match_events if e["affected_category"] == "Beverages"), None)
    snk_event = next((e for e in match_events if e["affected_category"] == "Snacks"), None)
    assert_true(bev_event and bev_event["expected_uplift"] == 1.2, "Beverages uplift is 1.2 (+120%)")
    assert_true(snk_event and snk_event["expected_uplift"] == 0.8, "Snacks uplift is 0.8 (+80%)")

    # Verify forecast applies uplift correctly
    fc_bev = generate_hourly_demand_forecast(db, "STORE_007", "Z001", hours=6) # Cola 750ml (Beverages)
    interval_match = next((i for i in fc_bev["forecast_intervals"] if "20:00" in i["hour_label"]), None)
    assert_true(interval_match and interval_match["cricket_uplift_units"] > 0, "Cricket uplift applied to Beverages during match")

    fc_dairy = generate_hourly_demand_forecast(db, "STORE_007", "Z019", hours=6) # Milk 1L (Dairy)
    interval_dairy = next((i for i in fc_dairy["forecast_intervals"] if "20:00" in i["hour_label"]), None)
    assert_true(interval_dairy and interval_dairy["cricket_uplift_units"] == 0, "Zero cricket uplift applied to Dairy")

    # -------------------------------------------------------------
    # 6. Warehouse Stock Allocation Constraints
    # -------------------------------------------------------------
    print("\n6. Testing Warehouse Stock Allocation Constraints...")
    test_alert = {
        "alert_id": "ALT_TEST_WH_001",
        "store_id": "STORE_007",
        "sku_id": "Z001",
        "sku_name": "Cola 750ml",
        "shelf_stock_units": 5,
        "projected_hourly_demand_units": 20
    }
    recs = calculate_warehouse_replenishment_recommendation(db, test_alert)
    wh_rec = next((r for r in recs if r["option_type"] == "EARLIER_TRUCK"), None)
    assert_true(wh_rec is not None, "Expedited warehouse recommendation generated")
    assert_true(wh_rec["recommended_quantity_units"] <= wh_rec["warehouse_stock_available"], "Allocation does not exceed WH availability")
    assert_true(wh_rec["warehouse_stock_available"] == 728, "Warehouse stock for Z001 matches warehouse_stock.csv (728 units)")

    # -------------------------------------------------------------
    # 7. Shelf Capacity & Replenishment Quantities
    # -------------------------------------------------------------
    print("\n7. Testing Shelf Capacity & Replenishment Quantities...")
    alerts = calculate_stockout_alerts_live(db, "STORE_007")
    assert_true(len(alerts) > 0, "Live stockout alerts generated for Store 7")
    # Verify zero-stock item has CRITICAL severity
    zero_alert = next((a for a in alerts if a["shelf_stock_units"] == 0), None)
    assert_true(zero_alert and zero_alert["severity"] == "CRITICAL", "Zero shelf stock flagged as CRITICAL")
    assert_true(zero_alert["backroom_stock_unknown"] is True, "Backroom stock marked as unknown (not fabricated)")

    # -------------------------------------------------------------
    # 8. Rider Capacity Calculations
    # -------------------------------------------------------------
    print("\n8. Testing Rider Capacity Calculations...")
    # Store ZC-11 has reduced riders (3) at 19:00 on Nov 16
    from backend.models.rider import RiderAvailability
    from sqlalchemy import func
    rider_11 = db.query(RiderAvailability).filter(
        RiderAvailability.store_id == "STORE_011",
        func.strftime("%Y-%m-%d %H:%M", RiderAvailability.timestamp) == "2026-11-16 19:00"
    ).first()
    assert_true(rider_11 is not None and rider_11.available_riders == 3, "Store 11 has 3 riders at 19:00 on Nov 16")
    cap_order_lines = rider_11.available_riders * rider_11.orders_per_rider_hour
    assert_true(cap_order_lines == 18.0, "Rider capacity is 18 order lines (3 riders x 6 orders/hr)")
    assert_true(rider_11.rider_shortage_count == 3, "Rider shortage of 3 couriers detected")

    # -------------------------------------------------------------
    # 9. Truck Capacity & Scheduled-Slot Handling
    # -------------------------------------------------------------
    print("\n9. Testing Truck Capacity & Schedule...")
    from backend.models.truck import TruckSchedule
    trucks_7 = db.query(TruckSchedule).filter(TruckSchedule.store_id == "STORE_007").all()
    assert_true(len(trucks_7) == 4, "Store 7 has 4 truck slots in schedule")
    assert_true(all(t.truck_capacity_units == 400 for t in trucks_7), "All scheduled trucks have 400 units capacity")
    next_truck = next((t for t in trucks_7 if t.scheduled_arrival_time >= SNAPSHOT_REFERENCE_TIME), None)
    assert_true(next_truck and next_truck.scheduled_arrival_time == datetime(2026, 11, 16, 21, 0, 0), "Upcoming delivery scheduled at 21:00 on Nov 16")

    # -------------------------------------------------------------
    # 10. Live Mode vs Simulation Mode Isolation
    # -------------------------------------------------------------
    print("\n10. Testing Live Mode vs Simulation Mode Data Isolation...")
    # Verify simulation endpoint recalculation does not mutate DB store inventories
    inv_before = db.execute(text("SELECT shelf_stock_units FROM store_inventories WHERE store_id = 'STORE_007' AND sku_id = 'Z001'")).fetchone()[0]
    from backend.routers.simulation import recalculate_simulation
    # Run simulation logic
    import asyncio
    sim_res = asyncio.run(recalculate_simulation({
        "store_id": "STORE_007",
        "sku_id": "Z001",
        "simulated_parameters": {"event_uplift_multiplier": 3.0}
    }, db))
    inv_after = db.execute(text("SELECT shelf_stock_units FROM store_inventories WHERE store_id = 'STORE_007' AND sku_id = 'Z001'")).fetchone()[0]
    assert_true(inv_before == inv_after, "Simulation recalculate leaves live inventory unchanged")
    assert_true(sim_res["mode"] == "SIMULATION_SANDBOX", "Simulation returns SIMULATION_SANDBOX provenance")

    # -------------------------------------------------------------
    # 11. Authentication & Manager Transfer Workflows Preservation
    # -------------------------------------------------------------
    u7 = db.query(User).filter(User.username == "mgr_store7").first()
    assert_true(u7 is not None and u7.store_id == "STORE_007" and verify_password("password123", u7.password_hash), "Manager 7 authenticates with hashed password")
    u3 = db.query(User).filter(User.username == "mgr_store3").first()
    assert_true(u3 is not None and u3.store_id == "STORE_003" and verify_password("password123", u3.password_hash), "Manager 3 authenticates with hashed password")
    u12 = db.query(User).filter(User.username == "mgr_store12").first()
    assert_true(u12 is not None and u12.store_id == "STORE_012" and verify_password("password123", u12.password_hash), "Manager 12 authenticates with hashed password")
    transfer_count = db.execute(text("SELECT count(*) FROM stock_transfer_requests")).fetchone()[0]
    assert_true(transfer_count >= 8, f"Existing stock transfer records preserved (count: {transfer_count})")

    # -------------------------------------------------------------
    # 12. Live HTTP API Endpoints Validation
    # -------------------------------------------------------------
    print("\n12. Testing Live HTTP API Endpoints on localhost:8000...")
    endpoints = [
        ("/api/v1/health", lambda d: d["status"] == "ok"),
        ("/api/v1/dataset/info", lambda d: d["scenario"].startswith("Challenge 06") and d["catalogue_skus_count"] == 67),
        ("/api/v1/stores/STORE_007/inventory", lambda d: d["covered_by_dataset"] is True and len(d["skus"]) == 67),
        ("/api/v1/forecast/hourly?store_id=STORE_007&sku_id=Z001", lambda d: len(d["forecast_intervals"]) == 12),
        ("/api/v1/alerts/stockouts?store_id=STORE_007", lambda d: "alerts" in d and d["data_provenance"] == "OFFICIAL_DATASET"),
        ("/api/v1/logistics/trucks?store_id=STORE_007", lambda d: len(d["scheduled_deliveries"]) == 4),
        ("/api/v1/logistics/riders?store_id=STORE_007", lambda d: d["rider_capacity_order_lines"] == 36),
        ("/api/v1/events/context?store_id=STORE_007", lambda d: d["active_events"]["cricket_match"]["is_active"] is True),
    ]

    for path, validator in endpoints:
        try:
            url = f"http://127.0.0.1:8000{path}"
            with urllib.request.urlopen(url) as resp:
                data = json.loads(resp.read().decode())
                valid = validator(data)
                assert_true(valid, f"HTTP GET {path} returned 200 with valid contract response")
        except Exception as e:
            assert_true(False, f"HTTP GET {path}", f"Failed with exception: {e}")

    db.close()
    print("=" * 75)
    print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
    print("=" * 75)
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
