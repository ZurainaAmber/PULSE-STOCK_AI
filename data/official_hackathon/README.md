# Challenge 06 – Before the Match Starts
**Zipcart**  ·  Data snapshot: 2026-11-16 16:00 (live snapshot)

## Files

### `events.csv`  (5 rows)

`date`, `time`, `event_type`, `category`, `expected_uplift`

### `orders.csv`  (26,726 rows)

`timestamp`, `store`, `sku`, `qty`

### `products.csv`  (67 rows)

`sku`, `product`, `category`, `size`, `selling_price`, `margin_pct`

### `riders.csv`  (600 rows)

`store`, `hour`, `riders_available`, `orders_per_rider_hour`

### `store_inventory.csv`  (804 rows)

`store`, `sku`, `stock`, `shelf_slot`, `slot_capacity`

### `truck_schedule.csv`  (48 rows)

`store`, `slot_time`, `truck_capacity_units`

### `warehouse_stock.csv`  (67 rows)

`sku`, `warehouse_stock`

## Notes

- `orders.csv` is hourly; a missing hour means zero orders for that SKU.
- Dataset covers 12 of the 30 stores and a sample of the catalogue.
- Rider capacity per hour = `riders_available` × `orders_per_rider_hour` (order lines).
- `events.csv` `expected_uplift` is a fraction applied to that category.

At hour 14 an updated version of one of these files will be released. Same columns, same format.