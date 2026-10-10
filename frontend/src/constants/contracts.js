/**
 * PulseStock AI - Canonical Contract Definitions
 * 
 * Sourced strictly from read-only contract specifications:
 * - contracts/api-spec.md
 * - contracts/data-schema.md
 * - contracts/engine-interface.md
 * - contracts/example-response.json
 * 
 * DO NOT modify these constants without updating the authoritative contracts.
 */

export const API_BASE_URL = 'http://localhost:8000/api/v1';

export const API_ENDPOINTS = {
  HEALTH: '/health',
  ALERTS: '/alerts/stockouts',
  ALERT_DETAIL: (alertId) => `/alerts/stockouts/${alertId}`,
  FORECAST_HOURLY: '/forecast/hourly',
  EVENTS_CONTEXT: '/events/context',
  STORE_INVENTORY: (storeId) => `/stores/${storeId}/inventory`,
  WAREHOUSE_AVAILABILITY: '/warehouses/availability',
  LOGISTICS_TRUCKS: '/logistics/trucks',
  LOGISTICS_DONORS: '/logistics/donors',
  LOGISTICS_RIDERS: '/logistics/riders',
  RECOMMENDATIONS: '/recommendations',
  RECOMMENDATION_APPROVE: (recId) => `/recommendations/${recId}/approve`,
  RECOMMENDATION_REJECT: (recId) => `/recommendations/${recId}/reject`,
  ACTIONS_HISTORY: '/actions/history',
  SIMULATION_RECALCULATE: '/simulation/recalculate',
};

export const ALERT_SEVERITY = {
  CRITICAL: 'CRITICAL', // Stockout within 60 mins
  HIGH: 'HIGH',         // Stockout within 120 mins
  MEDIUM: 'MEDIUM',     // Stockout within 240 mins
  LOW: 'LOW',           // No stockout within 4 hours
};

export const OPTION_TYPE = {
  TRANSFER: 'TRANSFER',           // Inter-store transfer via hyper-local riders
  EARLIER_TRUCK: 'EARLIER_TRUCK', // Expedite central warehouse truck dispatch
  SHELF_SWAP: 'SHELF_SWAP',       // Reallocate shelf space from slow-moving SKU
  WAIT: 'WAIT',                   // Wait for standard scheduled delivery truck
};

export const ACTION_STATUS = {
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXECUTED: 'EXECUTED',
};

export const ALERT_STATUS = {
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  EXPIRED: 'EXPIRED',
};

export const EVENT_TYPE = {
  CRICKET: 'CRICKET',
  RAIN: 'RAIN',
  FESTIVAL: 'FESTIVAL',
};

export const REJECTION_REASONS = [
  { code: 'STORE_3_RIDER_UNAVAILABLE', label: 'Rider unavailable at donor store / weather disruption' },
  { code: 'HIGH_EXECUTION_COST', label: 'Additional expedited freight / courier fee too high' },
  { code: 'INSUFFICIENT_SURPLUS', label: 'Donor store surplus buffer is too low' },
  { code: 'DELAYED_ETA', label: 'Estimated arrival time exceeds stockout deadline' },
  { code: 'OPERATIONAL_PREFERENCE', label: 'Alternative store replenishment preferred' },
];

export const DEFAULT_CONTEXT = {
  STORE_ID: 'STORE_007',
  STORE_NAME: 'Store 7 - Koramangala Tech Park',
  SKU_ID: 'SKU_COLD_DRINK_750ML',
  SKU_NAME: 'Sparkling Cola 750ml',
  DEFAULT_MANAGER_ID: 'MGR_KORAMANGALA_07',
  CURRENCY_SYMBOL: '₹',
};
