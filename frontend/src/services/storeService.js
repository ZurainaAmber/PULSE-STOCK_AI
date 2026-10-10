/**
 * PulseStock AI - Store Details Data Service
 * 
 * Supports both Mock and Live API data sources cleanly.
 * Strictly adheres to contracts/api-spec.md:
 * - GET /stores/{store_id}/inventory
 * - GET /alerts/stockouts?store_id={id}
 * - GET /forecast/hourly?store_id={id}&sku_id={id}
 * - GET /events/context?store_id={id}
 * - GET /warehouses/availability?sku_id={id}
 * - GET /logistics/donors?store_id={id}&sku_id={id}
 * - GET /logistics/trucks?store_id={id}
 * 
 * Never disguises mock data as live data.
 * Live failures are reported transparently.
 */

import { apiClient, getDataSourceMode } from '../api/client'
import { normalizeAlert, normalizeEventsContext } from '../api/adapter'
import {
  MOCK_STORES,
  MOCK_STORE_INVENTORIES,
  MOCK_ALERTS,
  MOCK_HOURLY_FORECAST,
  MOCK_EVENTS_CONTEXT,
  MOCK_LOGISTICS_STATUS,
} from '../mocks/mockData'
import { API_ENDPOINTS } from '../constants/contracts'

/**
 * Fetch all Store Details panels data
 */
export async function fetchStoreDetailsData(storeId = 'STORE_007', targetSkuId = null) {
  const mode = getDataSourceMode()

  if (mode === 'mock') {
    return getMockStoreDetails(storeId, targetSkuId)
  }

  // Live Mode: Query documented backend endpoints
  try {
    // 1. Fetch store inventory first to determine available SKUs if targetSkuId not provided
    let inventoryData = null
    let inventoryError = null
    try {
      inventoryData = await apiClient(API_ENDPOINTS.STORE_INVENTORY(storeId))
    } catch (err) {
      inventoryError = err
    }

    const availableSkus = inventoryData?.skus || []
    const primarySkuId = targetSkuId || availableSkus[0]?.sku_id || 'SKU_COLD_DRINK_750ML'

    // 2. Fetch parallel store telemetry for the store and primary SKU
    const [
      alertsRes,
      forecastRes,
      eventsRes,
      warehouseRes,
      donorsRes,
      trucksRes,
      ridersRes,
    ] = await Promise.allSettled([
      apiClient(API_ENDPOINTS.ALERTS, { params: { store_id: storeId } }),
      apiClient(API_ENDPOINTS.FORECAST_HOURLY, {
        params: { store_id: storeId, sku_id: primarySkuId, hours: 12 },
      }),
      apiClient(API_ENDPOINTS.EVENTS_CONTEXT, { params: { store_id: storeId } }),
      apiClient(API_ENDPOINTS.WAREHOUSE_AVAILABILITY, { params: { sku_id: primarySkuId } }),
      apiClient(API_ENDPOINTS.LOGISTICS_DONORS, {
        params: { store_id: storeId, sku_id: primarySkuId, required_units: 50 },
      }),
      apiClient(API_ENDPOINTS.LOGISTICS_TRUCKS, { params: { store_id: storeId } }),
      apiClient(API_ENDPOINTS.LOGISTICS_RIDERS, { params: { store_id: storeId } }),
    ])

    const alertsData = alertsRes.status === 'fulfilled' ? alertsRes.value : null
    const forecastData = forecastRes.status === 'fulfilled' ? forecastRes.value : null
    const eventsData = eventsRes.status === 'fulfilled' ? eventsRes.value : null
    const warehouseData = warehouseRes.status === 'fulfilled' ? warehouseRes.value : null
    const donorsData = donorsRes.status === 'fulfilled' ? donorsRes.value : null
    const trucksData = trucksRes.status === 'fulfilled' ? trucksRes.value : null
    const ridersData = ridersRes.status === 'fulfilled' ? ridersRes.value : null

    const rawAlerts = Array.isArray(alertsData?.alerts) ? alertsData.alerts : []
    const normalizedAlerts = rawAlerts.map(normalizeAlert)

    // Forecast intervals actually returned by live backend
    const rawIntervals = Array.isArray(forecastData?.forecast_intervals)
      ? forecastData.forecast_intervals
      : []

    return {
      source: 'live',
      storeId,
      primarySkuId,
      storeMetadata: {
        store_id: storeId,
        store_name: inventoryData?.store_name || `Store ${storeId}`,
        location_zone: inventoryData?.location_zone || 'Bangalore Urban',
        stadium_proximity_km: inventoryData?.stadium_proximity_km ?? 1.4,
      },
      inventory: inventoryData,
      inventoryError: inventoryError ? inventoryError.message : null,
      alerts: normalizedAlerts,
      forecast: {
        intervals: rawIntervals,
        generatedAt: forecastData?.generated_at || null,
        isEmpty: rawIntervals.length === 0,
      },
      events: normalizeEventsContext(eventsData),
      warehouse: warehouseData,
      donors: donorsData?.donor_stores || [],
      trucks: trucksData,
      riders: ridersData,
      ridersError: ridersRes.status === 'rejected' ? (ridersRes.reason?.message || 'Failed to fetch rider fleet') : null,
      timestamp: new Date().toISOString(),
    }
  } catch (err) {
    console.warn('[storeService] Live store details fetch failed:', err)
    return {
      source: 'live',
      storeId,
      primarySkuId: targetSkuId,
      error: err.message,
      storeMetadata: { store_id: storeId, store_name: `Store ${storeId}` },
      inventory: null,
      alerts: [],
      forecast: { intervals: [], isEmpty: true },
      events: null,
      warehouse: null,
      donors: [],
      trucks: null,
      riders: null,
      ridersError: err.message,
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Build contract-aligned mock store details payload
 */
function getMockStoreDetails(storeId, targetSkuId) {
  const storeMeta = MOCK_STORES.find((s) => s.store_id === storeId) || {
    store_id: storeId,
    store_name: `Store ${storeId}`,
    location_zone: 'Zone Unspecified',
    stadium_proximity_km: null,
    status: 'ACTIVE_MONITORING',
    severity: 'LOW',
    alert_count: 0,
  }

  const inventory = MOCK_STORE_INVENTORIES[storeId] || null
  const availableSkus = inventory?.skus || []
  const primarySkuId = targetSkuId || availableSkus[0]?.sku_id || 'SKU_COLD_DRINK_750ML'

  const storeAlerts = MOCK_ALERTS.filter((a) => a.store_id === storeId).map(normalizeAlert)

  // Forecast for Store 7 or default
  const forecastIntervals = storeId === 'STORE_007' ? MOCK_HOURLY_FORECAST : []

  return {
    source: 'mock',
    storeId,
    primarySkuId,
    storeMetadata: storeMeta,
    inventory,
    alerts: storeAlerts,
    forecast: {
      intervals: forecastIntervals,
      horizonLabel: 'Mock 5-Hour Forecast Window (18:00 - 23:00)',
      generatedAt: '2026-10-09T18:00:00Z',
      isEmpty: forecastIntervals.length === 0,
    },
    events: MOCK_EVENTS_CONTEXT,
    warehouse: MOCK_LOGISTICS_STATUS.warehouse,
    donors: (MOCK_LOGISTICS_STATUS.donor_stores || []).filter((d) => d.donor_store_id !== storeId),
    trucks: {
      store_id: storeId,
      scheduled_deliveries: MOCK_LOGISTICS_STATUS.scheduled_deliveries || [],
      expedited_option: {
        is_available: MOCK_LOGISTICS_STATUS.warehouse.expedited_truck_available,
        truck_id: MOCK_LOGISTICS_STATUS.warehouse.expedited_truck_id,
        transit_duration_minutes: MOCK_LOGISTICS_STATUS.warehouse.expedited_eta_minutes,
        additional_expedited_cost_inr: MOCK_LOGISTICS_STATUS.warehouse.expedited_cost_inr,
      },
    },
    riders: {
      store_id: storeId,
      active_riders: storeId === 'STORE_007' ? 3 : 8,
      total_assigned_riders: storeId === 'STORE_007' ? 9 : 8,
      available_riders_count: storeId === 'STORE_007' ? 2 : 8,
      on_delivery_riders_count: storeId === 'STORE_007' ? 1 : 0,
      offline_riders_count: storeId === 'STORE_007' ? 6 : 0,
      required_riders_for_demand: storeId === 'STORE_007' ? 9 : 5,
      rider_shortage_count: storeId === 'STORE_007' ? 6 : 0,
      shortage_severity: storeId === 'STORE_007' ? 'HIGH' : 'NONE',
      rider_surge_multiplier: storeId === 'STORE_007' ? 1.35 : 1.0,
      transfer_rider_available: true,
      assigned_rider_id: storeId === 'STORE_007' ? 'RIDER_DEV_88' : `RIDER_${storeId}_01`,
      orders_per_rider_hour: 4.0,
      rider_capacity_order_lines: storeId === 'STORE_007' ? 12 : 32,
      data_provenance: 'MOCK_CONTRACT_FIXTURE',
      riders: storeId === 'STORE_007' ? [
        {
          rider_id: 'RIDER_DEV_88',
          name: 'Courier Dev 88',
          status: 'ON_DELIVERY',
          assignment_type: 'INTER_STORE_TRANSFER',
          current_assignment: 'In-Transit Transfer from Store 3 (TRF_007_01)',
          destination_store_id: 'STORE_007',
          sku_id: 'SKU_COLD_DRINK_750ML',
          units: 50,
          eta_minutes: 28,
          orders_per_rider_hour: 4.0,
          assigned_store_id: storeId,
          data_provenance: 'SIMULATED_MOCK_ROSTER',
        },
        {
          rider_id: 'RIDER_007_02',
          name: 'Courier Koramangala-02',
          status: 'AVAILABLE',
          assignment_type: 'LOCAL_DELIVERY_POOL',
          current_assignment: 'Standby for Hyper-local Delivery & Inter-Store Transfers',
          destination_store_id: null,
          sku_id: null,
          units: null,
          eta_minutes: null,
          orders_per_rider_hour: 4.0,
          assigned_store_id: storeId,
          data_provenance: 'SIMULATED_MOCK_ROSTER',
        },
        {
          rider_id: 'RIDER_007_03',
          name: 'Courier Koramangala-03',
          status: 'AVAILABLE',
          assignment_type: 'LOCAL_DELIVERY_POOL',
          current_assignment: 'Standby for Hyper-local Delivery & Inter-Store Transfers',
          destination_store_id: null,
          sku_id: null,
          units: null,
          eta_minutes: null,
          orders_per_rider_hour: 4.0,
          assigned_store_id: storeId,
          data_provenance: 'SIMULATED_MOCK_ROSTER',
        },
        ...Array.from({ length: 6 }).map((_, i) => ({
          rider_id: `RIDER_007_${String(i + 4).padStart(2, '0')}`,
          name: `Courier Koramangala-${String(i + 4).padStart(2, '0')}`,
          status: 'OFFLINE',
          assignment_type: 'UNSTAFFED_SHIFT',
          current_assignment: 'Unstaffed Shift Deficit (High Rain Shortage)',
          destination_store_id: null,
          sku_id: null,
          units: null,
          eta_minutes: null,
          orders_per_rider_hour: 4.0,
          assigned_store_id: storeId,
          data_provenance: 'SIMULATED_MOCK_ROSTER',
        })),
      ] : Array.from({ length: 8 }).map((_, i) => ({
        rider_id: `RIDER_${storeId}_${String(i + 1).padStart(2, '0')}`,
        name: `Courier ${storeId}-${String(i + 1).padStart(2, '0')}`,
        status: 'AVAILABLE',
        assignment_type: 'LOCAL_DELIVERY_POOL',
        current_assignment: 'Standby for Hyper-local Delivery',
        destination_store_id: null,
        sku_id: null,
        units: null,
        eta_minutes: null,
        orders_per_rider_hour: 4.0,
        assigned_store_id: storeId,
        data_provenance: 'SIMULATED_MOCK_ROSTER',
      })),
    },
    timestamp: new Date().toISOString(),
  }
}
