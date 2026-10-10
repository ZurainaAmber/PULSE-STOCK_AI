/**
 * PulseStock AI - Data Normalization Adapter
 * 
 * Purpose:
 * Strictly bridges verified structural variations between the current backend
 * implementation and the authoritative contracts (contracts/api-spec.md).
 * 
 * Rules:
 * - Normalize ONLY documented, safe differences.
 * - Never silently discard fields.
 * - Report mismatches explicitly.
 * - Preserve raw payloads intact.
 */

/**
 * Audit log of detected contract mismatches in live data
 */
export const adapterMismatchLog = [];

function recordMismatch(endpoint, description, rawSample) {
  const entry = {
    timestamp: new Date().toISOString(),
    endpoint,
    description,
    rawSample,
  };
  adapterMismatchLog.push(entry);
  console.warn(`[PulseStock Adapter Mismatch] (${endpoint}): ${description}`, rawSample);
}

/**
 * Normalizes stockout alert objects
 */
export function normalizeAlert(raw) {
  if (!raw) return raw;

  // Check for field name variations between backend model and contract
  const hasDbColumnNames = 'current_total_stock' in raw && !('current_total_stock_units' in raw);
  if (hasDbColumnNames) {
    recordMismatch(
      '/alerts/stockouts',
      'Alert uses database column names (current_total_stock) instead of contract names (current_total_stock_units)',
      raw
    );
  }

  return {
    ...raw,
    // Ensure contract canonical names while preserving raw fields
    current_total_stock_units: raw.current_total_stock_units ?? raw.current_total_stock ?? 0,
    projected_hourly_demand_units: raw.projected_hourly_demand_units ?? raw.projected_hourly_demand ?? 0,
    estimated_stockout_timestamp: raw.estimated_stockout_timestamp ?? raw.estimated_stockout_time ?? null,
    _normalized: true,
  };
}

/**
 * Normalizes external event context
 * Contract expects: active_events: { cricket_match: {}, weather: {}, festival: {} }
 * Backend currently returns: { events: [...] }
 */
export function normalizeEventsContext(raw) {
  if (!raw) return raw;

  // Contract format: already has active_events
  if (raw.active_events) {
    return raw;
  }

  // Backend format: has events array
  if (Array.isArray(raw.events)) {
    recordMismatch(
      '/events/context',
      'Backend returned flat events array instead of nested active_events object defined by contract',
      raw
    );

    const activeEvents = {};
    raw.events.forEach((evt) => {
      const type = (evt.event_type || '').toUpperCase();
      if (type === 'CRICKET') {
        activeEvents.cricket_match = {
          is_active: Boolean(evt.is_active),
          match_id: evt.event_id,
          title: evt.title,
          category_uplift_multiplier: evt.multiplier || 1.0,
          ...evt,
        };
      } else if (type === 'RAIN') {
        activeEvents.weather = {
          is_active: Boolean(evt.is_active),
          condition: 'HEAVY_RAIN',
          precipitation_mm_per_hr: evt.precipitation_mm_hr || 0.0,
          category_uplift_multiplier: evt.multiplier || 1.0,
          ...evt,
        };
      } else if (type === 'FESTIVAL') {
        activeEvents.festival = {
          is_active: Boolean(evt.is_active),
          festival_name: evt.title,
          category_uplift_multiplier: evt.multiplier || 1.0,
          ...evt,
        };
      }
    });

    return {
      store_id: raw.store_id,
      active_events: activeEvents,
      _rawEvents: raw.events,
      _normalized: true,
    };
  }

  return raw;
}

/**
 * Normalizes recommendations
 * Contract expects: action_parameters (object), financial_impact (with net_gain_inr), tradeoff_analysis
 * Backend currently returns: action_params_json (string) and separate execution_cost_inr / revenue_saved_inr
 */
export function normalizeRecommendation(raw) {
  if (!raw) return raw;

  let actionParameters = raw.action_parameters;
  if (!actionParameters && typeof raw.action_params_json === 'string') {
    recordMismatch(
      '/recommendations',
      'action_params_json returned as serialized JSON string instead of parsed action_parameters object',
      raw.action_params_json
    );
    try {
      actionParameters = JSON.parse(raw.action_params_json);
    } catch (e) {
      actionParameters = { parseError: e.message, raw: raw.action_params_json };
    }
  }

  let financialImpact = raw.financial_impact;
  if (!financialImpact && ('execution_cost_inr' in raw || 'revenue_saved_inr' in raw)) {
    const cost = raw.execution_cost_inr ?? 0;
    const saved = raw.revenue_saved_inr ?? 0;
    financialImpact = {
      execution_cost_inr: cost,
      revenue_saved_inr: saved,
      net_gain_inr: Number((saved - cost).toFixed(2)),
    };
  }

  return {
    ...raw,
    action_parameters: actionParameters || {},
    financial_impact: financialImpact || { execution_cost_inr: 0, revenue_saved_inr: 0, net_gain_inr: 0 },
    tradeoff_analysis: raw.tradeoff_analysis || { pros: [], cons: [] },
    stockout_prevented: Boolean(raw.stockout_prevented),
    is_recommended: Boolean(raw.is_recommended),
    _normalized: true,
  };
}

/**
 * Normalizes action history log records
 * Contract: GET /actions/history
 * Fields: action_id, alert_id, recommendation_id, store_id, sku_id, action_type, status, manager_id, cost_inr, revenue_saved_inr, notes, created_at
 */
export function normalizeActionLog(raw) {
  if (!raw) return raw;

  // Check if live backend omitted revenue_saved_inr
  const hasRevenueSaved = 'revenue_saved_inr' in raw && raw.revenue_saved_inr !== null && raw.revenue_saved_inr !== undefined;
  if (!hasRevenueSaved && raw._source !== 'mock') {
    recordMismatch(
      '/actions/history',
      'Action log record does not contain revenue_saved_inr column (database schema limitation in live backend)',
      raw
    );
  }

  // Format ISO timestamp safely
  let timestamp = raw.created_at;
  if (timestamp && typeof timestamp === 'string' && !timestamp.endsWith('Z') && !timestamp.includes('+')) {
    timestamp = `${timestamp}Z`;
  }

  return {
    ...raw,
    action_id: raw.action_id || 'UNKNOWN_ACTION',
    alert_id: raw.alert_id || null,
    recommendation_id: raw.recommendation_id || null,
    store_id: raw.store_id || 'UNKNOWN_STORE',
    sku_id: raw.sku_id || 'UNKNOWN_SKU',
    action_type: (raw.action_type || 'UNKNOWN').toUpperCase(),
    status: (raw.status || 'PENDING').toUpperCase(),
    manager_id: raw.manager_id || 'UNASSIGNED',
    cost_inr: typeof raw.cost_inr === 'number' ? raw.cost_inr : 0,
    revenue_saved_inr: typeof raw.revenue_saved_inr === 'number' ? raw.revenue_saved_inr : null,
    notes: raw.notes || null,
    rejection_reason: raw.rejection_reason || null,
    created_at: timestamp || new Date().toISOString(),
    _normalized: true,
  };
}
