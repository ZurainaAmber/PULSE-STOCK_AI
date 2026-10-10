"""
PulseStock AI - Official Hackathon Dark Store Dataset Ingestion Pipeline
Challenge 06 – Before the Match Starts (Zipcart)

Authoritative Reference Time: 2026-11-16 16:00:00 (Live Snapshot)
Supported Official Dark Stores: ZC-01 through ZC-12 (mapped to STORE_001 through STORE_012)
"""

import os
import csv
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger("pulsestock.ingestion")

# Snapshot Reference Time as defined in Challenge 06 README
SNAPSHOT_REFERENCE_TIME = datetime(2026, 11, 16, 16, 0, 0)

# Verified mapping between Hackathon Dark Store IDs and internal Store IDs
STORE_MAPPING: Dict[str, str] = {
    f"ZC-{i:02d}": f"STORE_{i:03d}" for i in range(1, 13)
}
REVERSE_STORE_MAPPING: Dict[str, str] = {v: k for k, v in STORE_MAPPING.items()}

# Stores 13-30 are supported in the app but not covered by the official 12-store hackathon dataset
UNCOVERED_STORES: List[str] = [f"STORE_{i:03d}" for i in range(13, 31)]

def resolve_store_id(raw_store_id: str) -> str:
    """Normalize any store identifier (ZC-07, STORE_007, 7) to canonical STORE_xxx."""
    if not raw_store_id:
        return raw_store_id
    clean = str(raw_store_id).strip().upper()
    if clean in STORE_MAPPING:
        return STORE_MAPPING[clean]
    if clean in REVERSE_STORE_MAPPING or clean.startswith("STORE_"):
        return clean
    if clean.isdigit():
        num = int(clean)
        return f"STORE_{num:03d}"
    return clean

def to_dataset_store_id(canonical_store_id: str) -> Optional[str]:
    """Convert canonical STORE_xxx to dataset identifier ZC-xx if covered."""
    return REVERSE_STORE_MAPPING.get(canonical_store_id)

def is_store_covered(store_id: str) -> bool:
    """Check if the store is covered by the official hackathon dataset."""
    canonical = resolve_store_id(store_id)
    return canonical in REVERSE_STORE_MAPPING


class ValidationReport:
    """Tracks records processed, inserted, updated, rejected, and validation warnings."""
    def __init__(self):
        self.files_processed: Dict[str, Dict[str, Any]] = {}
        self.warnings: List[str] = []
        self.errors: List[str] = []

    def log_file(self, filename: str, read_count: int, valid_count: int, inserted: int, updated: int, rejected: int):
        self.files_processed[filename] = {
            "read": read_count,
            "valid": valid_count,
            "inserted": inserted,
            "updated": updated,
            "rejected": rejected
        }

    def add_warning(self, msg: str):
        self.warnings.append(msg)
        logger.warning(msg)

    def add_error(self, msg: str):
        self.errors.append(msg)
        logger.error(msg)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": len(self.errors) == 0,
            "reference_time": SNAPSHOT_REFERENCE_TIME.isoformat(),
            "covered_stores": list(STORE_MAPPING.keys()),
            "files": self.files_processed,
            "warnings_count": len(self.warnings),
            "warnings": self.warnings[:50],  # cap to top 50
            "errors": self.errors
        }


def read_csv_safe(file_path: str, required_columns: List[str]) -> Tuple[List[Dict[str, str]], List[str]]:
    """Read a CSV file safely, verifying existence and required header columns."""
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"Source file not found: {file_path}")
    
    rows = []
    warnings = []
    with open(file_path, "r", encoding="utf-8-sig") as fp:
        reader = csv.DictReader(fp)
        missing = [col for col in required_columns if col not in reader.fieldnames]
        if missing:
            raise ValueError(f"File {os.path.basename(file_path)} missing required columns: {missing}")
        
        for idx, row in enumerate(reader, start=2):
            # Check for totally blank lines
            if not any(v.strip() for v in row.values() if v):
                continue
            rows.append(row)
    return rows, warnings


def ingest_official_dataset(data_dir: str, db: Session) -> ValidationReport:
    """
    Ingest all 7 hackathon CSV files transactionally into SQLite database.
    Idempotent: running multiple times updates existing records without duplication.
    Preserves all user accounts, sessions, and manager stock transfers.
    """
    report = ValidationReport()
    
    # Check that data directory exists
    if not os.path.isdir(data_dir):
        report.add_error(f"Dataset directory not found: {data_dir}")
        return report

    # 1. Ingest products.csv
    products_path = os.path.join(data_dir, "products.csv")
    valid_products = []
    valid_skus = set()
    product_categories = {}
    
    try:
        raw_products, _ = read_csv_safe(products_path, ["sku", "product", "category", "size", "selling_price", "margin_pct"])
        for idx, row in enumerate(raw_products, start=2):
            sku = row["sku"].strip()
            name = row["product"].strip()
            category = row["category"].strip()
            size = row["size"].strip()
            try:
                price = float(row["selling_price"])
                margin = float(row["margin_pct"])
                if price <= 0:
                    report.add_warning(f"products.csv row {idx}: Non-positive price for SKU {sku}")
                cost = round(price * (1.0 - margin), 2)
            except ValueError as e:
                report.add_warning(f"products.csv row {idx}: Invalid numeric value: {e}")
                continue
            
            valid_products.append({
                "sku_id": sku,
                "sku_name": name,
                "category": category,
                "size": size,
                "unit_selling_price_inr": price,
                "margin_pct": margin,
                "unit_cost_price_inr": cost,
            })
            valid_skus.add(sku)
            product_categories[sku] = category

    except Exception as e:
        report.add_error(f"Failed to read products.csv: {e}")
        return report

    # 2. Ingest store_inventory.csv
    inventory_path = os.path.join(data_dir, "store_inventory.csv")
    valid_inventory = []
    try:
        raw_inv, _ = read_csv_safe(inventory_path, ["store", "sku", "stock", "shelf_slot", "slot_capacity"])
        for idx, row in enumerate(raw_inv, start=2):
            st = row["store"].strip()
            sku = row["sku"].strip()
            if st not in STORE_MAPPING:
                report.add_warning(f"store_inventory.csv row {idx}: Unknown store '{st}'")
                continue
            if sku not in valid_skus:
                report.add_warning(f"store_inventory.csv row {idx}: Unknown SKU '{sku}'")
                continue
            try:
                stock = int(row["stock"])
                cap = int(row["slot_capacity"])
            except ValueError as e:
                report.add_warning(f"store_inventory.csv row {idx}: Invalid integers: {e}")
                continue

            canonical_store = STORE_MAPPING[st]
            # Safety stock is 25% of capacity, reorder point is 50%
            safety = max(2, int(cap * 0.25))
            reorder = max(5, int(cap * 0.5))

            valid_inventory.append({
                "store_id": canonical_store,
                "sku_id": sku,
                "shelf_slot": row["shelf_slot"].strip(),
                "shelf_stock_units": stock,
                "shelf_capacity_units": cap,
                "backroom_stock_units": 0,  # NOT fabricated; explicitly recorded as 0 with unknown flag in queries
                "total_stock_units": stock,
                "safety_stock_threshold_units": safety,
                "reorder_point_units": reorder,
            })
    except Exception as e:
        report.add_error(f"Failed to read store_inventory.csv: {e}")
        return report

    # 3. Ingest warehouse_stock.csv
    warehouse_path = os.path.join(data_dir, "warehouse_stock.csv")
    valid_warehouse = []
    try:
        raw_wh, _ = read_csv_safe(warehouse_path, ["sku", "warehouse_stock"])
        for idx, row in enumerate(raw_wh, start=2):
            sku = row["sku"].strip()
            if sku not in valid_skus:
                report.add_warning(f"warehouse_stock.csv row {idx}: Unknown SKU '{sku}'")
                continue
            try:
                wh_stock = int(row["warehouse_stock"])
            except ValueError as e:
                report.add_warning(f"warehouse_stock.csv row {idx}: Invalid integer stock: {e}")
                continue
            
            valid_warehouse.append({
                "warehouse_id": "WH_CENTRAL_01",
                "sku_id": sku,
                "available_stock_units": wh_stock,
                "free_stock_units": wh_stock,
                "reserved_stock_units": 0
            })
    except Exception as e:
        report.add_error(f"Failed to read warehouse_stock.csv: {e}")
        return report

    # 4. Ingest events.csv
    events_path = os.path.join(data_dir, "events.csv")
    valid_events = []
    try:
        raw_events, _ = read_csv_safe(events_path, ["date", "time", "event_type", "category", "expected_uplift"])
        for idx, row in enumerate(raw_events, start=2):
            dt_str = row["date"].strip()
            time_str = row["time"].strip()
            event_type = row["event_type"].strip()
            cat = row["category"].strip()
            try:
                uplift = float(row["expected_uplift"])
            except ValueError as e:
                report.add_warning(f"events.csv row {idx}: Invalid expected_uplift: {e}")
                continue

            # Safe handling of "All day" vs HH:MM clock times
            if time_str.lower() in ("all day", "allday"):
                start_dt = datetime.strptime(f"{dt_str} 00:00:00", "%Y-%m-%d %H:%M:%S")
                end_dt = datetime.strptime(f"{dt_str} 23:59:59", "%Y-%m-%d %H:%M:%S")
                time_slug = "ALLDAY"
            else:
                try:
                    event_clock = datetime.strptime(f"{dt_str} {time_str}", "%Y-%m-%d %H:%M")
                    # Window starts 30m before match and extends 4 hours
                    start_dt = event_clock - timedelta(minutes=30)
                    end_dt = event_clock + timedelta(hours=4)
                    time_slug = time_str.replace(":", "")
                except ValueError as e:
                    report.add_warning(f"events.csv row {idx}: Could not parse date/time: {e}")
                    continue

            # Event is active if snapshot reference time is within [start_dt, end_dt]
            # OR if it starts on the snapshot date (e.g., Nov 16 evening match)
            is_active = 1 if (start_dt <= SNAPSHOT_REFERENCE_TIME <= end_dt or start_dt.date() == SNAPSHOT_REFERENCE_TIME.date()) else 0
            type_slug = "CRICKET" if "CRICKET" in event_type.upper() else ("WEEKEND" if "WEEKEND" in event_type.upper() else "FESTIVAL")
            cat_slug = cat.replace(" ", "").replace("&", "")
            event_id = f"EVT_{dt_str.replace('-', '')}_{type_slug}_{cat_slug}_{time_slug}"

            valid_events.append({
                "event_id": event_id,
                "event_type": type_slug,
                "title": f"{event_type} - {cat} Uplift",
                "store_id": None,  # Applies across all relevant stores
                "affected_category": cat,
                "multiplier": round(1.0 + uplift, 4),
                "expected_uplift": uplift,
                "precipitation_mm_hr": 0.0,
                "is_active": is_active,
                "start_time": start_dt,
                "end_time": end_dt
            })
    except Exception as e:
        report.add_error(f"Failed to read events.csv: {e}")
        return report

    # 5. Ingest riders.csv
    riders_path = os.path.join(data_dir, "riders.csv")
    valid_riders = []
    try:
        raw_riders, _ = read_csv_safe(riders_path, ["store", "hour", "riders_available", "orders_per_rider_hour"])
        for idx, row in enumerate(raw_riders, start=2):
            st = row["store"].strip()
            if st not in STORE_MAPPING:
                continue
            canonical_store = STORE_MAPPING[st]
            try:
                hour_dt = datetime.strptime(row["hour"].strip(), "%Y-%m-%d %H:%M")
                avail = int(row["riders_available"])
                rate = float(row["orders_per_rider_hour"])
            except ValueError as e:
                report.add_warning(f"riders.csv row {idx}: Parsing error: {e}")
                continue

            # Standard dark store baseline staffing target is 6 riders
            required = 6
            shortage = max(0, required - avail)
            severity = "CRITICAL" if shortage >= 3 else ("HIGH" if shortage > 0 else "NONE")

            valid_riders.append({
                "timestamp": hour_dt,
                "store_id": canonical_store,
                "available_riders": avail,
                "required_riders": required,
                "orders_per_rider_hour": rate,
                "rider_shortage_count": shortage,
                "shortage_severity": severity
            })
    except Exception as e:
        report.add_error(f"Failed to read riders.csv: {e}")
        return report

    # 6. Ingest truck_schedule.csv
    truck_path = os.path.join(data_dir, "truck_schedule.csv")
    valid_trucks = []
    try:
        raw_trucks, _ = read_csv_safe(truck_path, ["store", "slot_time", "truck_capacity_units"])
        for idx, row in enumerate(raw_trucks, start=2):
            st = row["store"].strip()
            if st not in STORE_MAPPING:
                continue
            canonical_store = STORE_MAPPING[st]
            try:
                slot_dt = datetime.strptime(row["slot_time"].strip(), "%Y-%m-%d %H:%M")
                cap = int(row["truck_capacity_units"])
            except ValueError as e:
                report.add_warning(f"truck_schedule.csv row {idx}: Parsing error: {e}")
                continue

            dep_dt = slot_dt - timedelta(hours=1)
            time_slug = slot_dt.strftime("%Y%m%d_%H%M")
            truck_id = f"TRK_{canonical_store}_{time_slug}"
            status = "COMPLETED" if slot_dt < SNAPSHOT_REFERENCE_TIME else "SCHEDULED"

            valid_trucks.append({
                "truck_id": truck_id,
                "store_id": canonical_store,
                "route_id": f"ROUTE_WH_{canonical_store}",
                "driver_name": "Scheduled Fleet Driver",
                "scheduled_departure_time": dep_dt,
                "scheduled_arrival_time": slot_dt,
                "truck_capacity_units": cap,
                "status": status,
                "sku_id": "Z001",  # Representative primary SKU
                "allocated_quantity_units": cap
            })
    except Exception as e:
        report.add_error(f"Failed to read truck_schedule.csv: {e}")
        return report

    # 7. Ingest orders.csv
    orders_path = os.path.join(data_dir, "orders.csv")
    valid_orders = []
    try:
        raw_orders, _ = read_csv_safe(orders_path, ["timestamp", "store", "sku", "qty"])
        for idx, row in enumerate(raw_orders, start=2):
            st = row["store"].strip()
            sku = row["sku"].strip()
            if st not in STORE_MAPPING:
                continue
            if sku not in valid_skus:
                continue
            try:
                dt = datetime.strptime(row["timestamp"].strip(), "%Y-%m-%d %H:%M")
                qty = int(row["qty"])
            except ValueError as e:
                report.add_warning(f"orders.csv row {idx}: Parsing error: {e}")
                continue

            canonical_store = STORE_MAPPING[st]
            valid_orders.append({
                "timestamp": dt,
                "store_id": canonical_store,
                "sku_id": sku,
                "quantity": qty
            })
    except Exception as e:
        report.add_error(f"Failed to read orders.csv: {e}")
        return report

    # -------------------------------------------------------------
    # Execute Database Updates Inside a Single Safe Transaction
    # -------------------------------------------------------------
    try:
        # Check if expected_uplift column exists in external_events
        try:
            col_check = db.execute(text("PRAGMA table_info(external_events)")).fetchall()
            col_names = [c[1] for c in col_check]
            if "expected_uplift" not in col_names:
                db.execute(text("ALTER TABLE external_events ADD COLUMN expected_uplift FLOAT DEFAULT 0.0"))
            if "data_provenance" not in [c[1] for c in db.execute(text("PRAGMA table_info(store_inventories)")).fetchall()]:
                db.execute(text("ALTER TABLE store_inventories ADD COLUMN data_provenance VARCHAR DEFAULT 'OFFICIAL_DATASET'"))
            if "backroom_stock_unknown" not in [c[1] for c in db.execute(text("PRAGMA table_info(store_inventories)")).fetchall()]:
                db.execute(text("ALTER TABLE store_inventories ADD COLUMN backroom_stock_unknown INTEGER DEFAULT 1"))
            db.commit()
        except Exception as e:
            logger.info("Column check note: %s", e)
            db.rollback()

        covered_canonical_stores = list(STORE_MAPPING.values())

        # 1. Upsert Products
        ins_prod = 0
        upd_prod = 0
        for p in valid_products:
            exists = db.execute(text("SELECT 1 FROM skus WHERE sku_id = :sku_id"), {"sku_id": p["sku_id"]}).fetchone()
            if exists:
                db.execute(text("""
                    UPDATE skus SET
                        sku_name = :sku_name,
                        category = :category,
                        size = :size,
                        unit_selling_price_inr = :unit_selling_price_inr,
                        margin_pct = :margin_pct,
                        unit_cost_price_inr = :unit_cost_price_inr
                    WHERE sku_id = :sku_id
                """), p)
                upd_prod += 1
            else:
                db.execute(text("""
                    INSERT INTO skus (sku_id, sku_name, category, size, unit_selling_price_inr, margin_pct, unit_cost_price_inr, created_at)
                    VALUES (:sku_id, :sku_name, :category, :size, :unit_selling_price_inr, :margin_pct, :unit_cost_price_inr, :created_at)
                """), {**p, "created_at": datetime.utcnow()})
                ins_prod += 1
        report.log_file("products.csv", len(raw_products), len(valid_products), ins_prod, upd_prod, len(raw_products) - len(valid_products))

        # 2. Upsert Store Inventories (for covered stores)
        ins_inv = 0
        upd_inv = 0
        for inv in valid_inventory:
            exists = db.execute(text("""
                SELECT id FROM store_inventories WHERE store_id = :store_id AND sku_id = :sku_id
            """), {"store_id": inv["store_id"], "sku_id": inv["sku_id"]}).fetchone()
            
            params = {
                **inv,
                "updated_at": datetime.utcnow(),
                "data_provenance": "OFFICIAL_DATASET",
                "backroom_stock_unknown": 1
            }
            if exists:
                db.execute(text("""
                    UPDATE store_inventories SET
                        shelf_slot = :shelf_slot,
                        shelf_stock_units = :shelf_stock_units,
                        shelf_capacity_units = :shelf_capacity_units,
                        backroom_stock_units = :backroom_stock_units,
                        total_stock_units = :total_stock_units,
                        safety_stock_threshold_units = :safety_stock_threshold_units,
                        reorder_point_units = :reorder_point_units,
                        updated_at = :updated_at,
                        data_provenance = :data_provenance,
                        backroom_stock_unknown = :backroom_stock_unknown
                    WHERE store_id = :store_id AND sku_id = :sku_id
                """), params)
                upd_inv += 1
            else:
                db.execute(text("""
                    INSERT INTO store_inventories (
                        store_id, sku_id, shelf_slot, shelf_stock_units, shelf_capacity_units,
                        backroom_stock_units, total_stock_units, safety_stock_threshold_units,
                        reorder_point_units, updated_at, data_provenance, backroom_stock_unknown
                    ) VALUES (
                        :store_id, :sku_id, :shelf_slot, :shelf_stock_units, :shelf_capacity_units,
                        :backroom_stock_units, :total_stock_units, :safety_stock_threshold_units,
                        :reorder_point_units, :updated_at, :data_provenance, :backroom_stock_unknown
                    )
                """), params)
                ins_inv += 1
        report.log_file("store_inventory.csv", len(raw_inv), len(valid_inventory), ins_inv, upd_inv, len(raw_inv) - len(valid_inventory))

        # 3. Upsert Warehouse Stock
        ins_wh = 0
        upd_wh = 0
        for wh in valid_warehouse:
            exists = db.execute(text("""
                SELECT id FROM warehouse_stock WHERE warehouse_id = :warehouse_id AND sku_id = :sku_id
            """), {"warehouse_id": wh["warehouse_id"], "sku_id": wh["sku_id"]}).fetchone()
            if exists:
                db.execute(text("""
                    UPDATE warehouse_stock SET
                        available_stock_units = :available_stock_units,
                        free_stock_units = :free_stock_units,
                        reserved_stock_units = :reserved_stock_units
                    WHERE warehouse_id = :warehouse_id AND sku_id = :sku_id
                """), wh)
                upd_wh += 1
            else:
                db.execute(text("""
                    INSERT INTO warehouse_stock (warehouse_id, sku_id, available_stock_units, free_stock_units, reserved_stock_units)
                    VALUES (:warehouse_id, :sku_id, :available_stock_units, :free_stock_units, :reserved_stock_units)
                """), wh)
                ins_wh += 1
        report.log_file("warehouse_stock.csv", len(raw_wh), len(valid_warehouse), ins_wh, upd_wh, len(raw_wh) - len(valid_warehouse))

        # 4. Upsert External Events
        ins_evt = 0
        upd_evt = 0
        for evt in valid_events:
            exists = db.execute(text("SELECT 1 FROM external_events WHERE event_id = :event_id"), {"event_id": evt["event_id"]}).fetchone()
            if exists:
                db.execute(text("""
                    UPDATE external_events SET
                        event_type = :event_type,
                        title = :title,
                        store_id = :store_id,
                        affected_category = :affected_category,
                        multiplier = :multiplier,
                        expected_uplift = :expected_uplift,
                        precipitation_mm_hr = :precipitation_mm_hr,
                        is_active = :is_active,
                        start_time = :start_time,
                        end_time = :end_time
                    WHERE event_id = :event_id
                """), evt)
                upd_evt += 1
            else:
                db.execute(text("""
                    INSERT INTO external_events (
                        event_id, event_type, title, store_id, affected_category,
                        multiplier, expected_uplift, precipitation_mm_hr, is_active, start_time, end_time
                    ) VALUES (
                        :event_id, :event_type, :title, :store_id, :affected_category,
                        :multiplier, :expected_uplift, :precipitation_mm_hr, :is_active, :start_time, :end_time
                    )
                """), evt)
                ins_evt += 1
        report.log_file("events.csv", len(raw_events), len(valid_events), ins_evt, upd_evt, len(raw_events) - len(valid_events))

        # 5. Refresh Truck Schedules for covered stores (idempotent replacement)
        store_placeholders = ", ".join(f":s_{i}" for i in range(len(covered_canonical_stores)))
        store_params = {f"s_{i}": s for i, s in enumerate(covered_canonical_stores)}
        db.execute(text(f"DELETE FROM truck_schedules WHERE store_id IN ({store_placeholders})"), store_params)
        
        for trk in valid_trucks:
            db.execute(text("""
                INSERT INTO truck_schedules (
                    truck_id, store_id, route_id, driver_name, scheduled_departure_time,
                    scheduled_arrival_time, truck_capacity_units, status, sku_id, allocated_quantity_units
                ) VALUES (
                    :truck_id, :store_id, :route_id, :driver_name, :scheduled_departure_time,
                    :scheduled_arrival_time, :truck_capacity_units, :status, :sku_id, :allocated_quantity_units
                )
            """), trk)
        report.log_file("truck_schedule.csv", len(raw_trucks), len(valid_trucks), len(valid_trucks), 0, len(raw_trucks) - len(valid_trucks))

        # 6. Refresh Rider Availability for covered stores (idempotent replacement)
        db.execute(text(f"DELETE FROM rider_availability WHERE store_id IN ({store_placeholders})"), store_params)
        for rdr in valid_riders:
            db.execute(text("""
                INSERT INTO rider_availability (
                    timestamp, store_id, available_riders, required_riders,
                    orders_per_rider_hour, rider_shortage_count, shortage_severity
                ) VALUES (
                    :timestamp, :store_id, :available_riders, :required_riders,
                    :orders_per_rider_hour, :rider_shortage_count, :shortage_severity
                )
            """), rdr)
        report.log_file("riders.csv", len(raw_riders), len(valid_riders), len(valid_riders), 0, len(raw_riders) - len(valid_riders))

        # 7. Refresh Orders for covered stores (idempotent replacement in transaction)
        db.execute(text(f"DELETE FROM orders WHERE store_id IN ({store_placeholders})"), store_params)
        
        # Batch insert orders for speed
        BATCH_SIZE = 1000
        for i in range(0, len(valid_orders), BATCH_SIZE):
            batch = valid_orders[i:i + BATCH_SIZE]
            db.execute(text("""
                INSERT INTO orders (timestamp, store_id, sku_id, quantity)
                VALUES (:timestamp, :store_id, :sku_id, :quantity)
            """), batch)
        report.log_file("orders.csv", len(raw_orders), len(valid_orders), len(valid_orders), 0, len(raw_orders) - len(valid_orders))

        # Commit all changes atomically
        db.commit()
        logger.info("Successfully ingested official dataset into database.")

    except Exception as e:
        db.rollback()
        report.add_error(f"Database transaction error during ingestion: {e}")
        logger.exception("Database transaction failed")
        return report

    return report
