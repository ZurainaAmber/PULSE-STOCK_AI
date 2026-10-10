/**
 * PulseStock AI - Manager Dashboard Data Service
 * 
 * Supports both Mock and Live API data sources cleanly.
 * Strictly adheres to contracts/api-spec.md:
 * - GET  /alerts/stockouts
 * - GET  /recommendations?alert_id={id}
 * - GET  /forecast/hourly?store_id={id}&sku_id={id}
 * - POST /recommendations/{id}/approve
 * - POST /recommendations/{id}/reject
 * 
 * Never disguises mock data as live data.
 * Live failures are reported transparently.
 */

import { apiClient, getDataSourceMode, ApiError } from '../api/client'
import { normalizeAlert, normalizeRecommendation } from '../api/adapter'
import {
  MOCK_ALERTS,
  MOCK_RECOMMENDATIONS,
  MOCK_HOURLY_FORECAST,
  MOCK_LOGISTICS_STATUS,
  MOCK_STORE_INVENTORY,
} from '../mocks/mockData'
import { API_ENDPOINTS, DEFAULT_CONTEXT } from '../constants/contracts'

// In-memory isolated mock state for testing approval / rejection workflows
let inMemoryMockAlerts = JSON.parse(JSON.stringify(MOCK_ALERTS))
let inMemoryMockRecommendations = JSON.parse(JSON.stringify(MOCK_RECOMMENDATIONS))
let inMemoryMockActionHistory = []

/**
 * Fetch stockout alerts
 */
export async function fetchStockoutAlerts(storeId = null) {
  const mode = getDataSourceMode()

  if (mode === 'mock') {
    let alerts = [...inMemoryMockAlerts]
    if (storeId) {
      alerts = alerts.filter((a) => a.store_id === storeId)
    }
    // Return normalized mock alerts with explicit provenance
    return {
      source: 'mock',
      alerts: alerts.map(normalizeAlert),
      total: alerts.length,
      timestamp: new Date().toISOString(),
    }
  }

  // Live Mode: GET /api/v1/alerts/stockouts
  const params = {}
  if (storeId) params.store_id = storeId

  const data = await apiClient(API_ENDPOINTS.ALERTS, { params })
  const rawAlerts = Array.isArray(data?.alerts) ? data.alerts : []

  return {
    source: 'live',
    alerts: rawAlerts.map(normalizeAlert),
    total: data?.total_alerts ?? rawAlerts.length,
    timestamp: data?.timestamp ?? new Date().toISOString(),
  }
}

/**
 * Fetch recommendations for an alert
 */
export async function fetchRecommendations(alertId) {
  const mode = getDataSourceMode()

  if (mode === 'mock') {
    // Look up in-memory mock recommendations
    let recs = inMemoryMockRecommendations.filter((r) => r.alert_id === alertId)
    if (recs.length === 0) {
      // Fall back to Store 7 base recommendations if exploring other mock alerts
      recs = inMemoryMockRecommendations
    }
    return {
      source: 'mock',
      alertId,
      recommendations: recs.map(normalizeRecommendation),
      evaluatedAt: new Date().toISOString(),
    }
  }

  // Live Mode: GET /api/v1/recommendations?alert_id={alertId}
  const data = await apiClient(API_ENDPOINTS.RECOMMENDATIONS, {
    params: { alert_id: alertId },
  })
  const rawRecs = Array.isArray(data?.recommendations) ? data.recommendations : []

  return {
    source: 'live',
    alertId,
    recommendations: rawRecs.map(normalizeRecommendation),
    evaluatedAt: data?.evaluated_at ?? new Date().toISOString(),
  }
}

/**
 * Fetch hourly forecast curve
 */
export async function fetchHourlyForecast(storeId, skuId) {
  const mode = getDataSourceMode()

  if (mode === 'mock') {
    return {
      source: 'mock',
      storeId,
      skuId,
      horizonNote: '5-Hour Forecast Window (Contract Horizon)',
      forecastIntervals: [...MOCK_HOURLY_FORECAST],
    }
  }

  // Live Mode: GET /api/v1/forecast/hourly
  const data = await apiClient(API_ENDPOINTS.FORECAST_HOURLY, {
    params: { store_id: storeId, sku_id: skuId },
  })

  const intervals = Array.isArray(data?.forecast_intervals) ? data.forecast_intervals : []

  return {
    source: 'live',
    storeId,
    skuId,
    horizonNote: intervals.length > 0
      ? `${intervals.length}-Hour Forecast Window`
      : 'Forecast intervals empty (Decision Engine pending implementation on backend)',
    forecastIntervals: intervals,
  }
}

/**
 * Approve a recommendation
 */
export async function approveRecommendation(recommendationId, {
  managerId = DEFAULT_CONTEXT.DEFAULT_MANAGER_ID,
  managerNotes = '',
  overrideQuantityUnits = null,
} = {}) {
  const mode = getDataSourceMode()

  if (mode === 'mock') {
    // Update isolated in-memory mock record
    const targetIdx = inMemoryMockRecommendations.findIndex(
      (r) => r.recommendation_id === recommendationId
    )
    const targetRec = targetIdx !== -1 ? inMemoryMockRecommendations[targetIdx] : null

    const actionId = `ACT_MOCK_${Date.now().toString().slice(-6)}`
    if (targetIdx !== -1) {
      inMemoryMockRecommendations[targetIdx] = {
        ...inMemoryMockRecommendations[targetIdx],
        _status: 'APPROVED',
        _actionId: actionId,
        _overrideQuantity: overrideQuantityUnits,
      }
    }

    const result = {
      action_id: actionId,
      alert_id: targetRec?.alert_id || 'ALT_20261009_007_01',
      recommendation_id: recommendationId,
      store_id: targetRec?.store_id || 'STORE_007',
      sku_id: targetRec?.sku_id || 'SKU_COLD_DRINK_750ML',
      action_type: targetRec?.option_type || 'TRANSFER',
      status: 'APPROVED',
      executed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      manager_id: managerId,
      action_summary: `[MOCK] Approved recommendation with ${overrideQuantityUnits ? `${overrideQuantityUnits} units override` : 'default quantity'}.`,
      notes: managerNotes || `Approved ${targetRec?.option_type || 'action'} recommendation via manager decision.`,
      cost_inr: typeof targetRec?.execution_cost_inr === 'number' ? targetRec.execution_cost_inr : 150.0,
      revenue_saved_inr: typeof targetRec?.revenue_saved_inr === 'number' ? targetRec.revenue_saved_inr : 4500.0,
      simulated_outcome: {
        stockout_prevented: true,
        expected_arrival_time: new Date(Date.now() + 28 * 60000).toISOString(),
      },
      _source: 'mock',
    }

    inMemoryMockActionHistory.unshift(result)
    return result
  }

  // Live Mode: POST /api/v1/recommendations/{recommendation_id}/approve
  const payload = {
    manager_id: managerId,
    manager_notes: managerNotes,
    override_quantity_units: overrideQuantityUnits ? Number(overrideQuantityUnits) : null,
  }

  const endpoint = API_ENDPOINTS.RECOMMENDATION_APPROVE(recommendationId)
  const result = await apiClient(endpoint, {
    method: 'POST',
    body: payload,
  })

  return {
    ...result,
    _source: 'live',
  }
}

/**
 * Reject a recommendation
 */
export async function rejectRecommendation(recommendationId, {
  managerId = DEFAULT_CONTEXT.DEFAULT_MANAGER_ID,
  rejectionReason,
  notes = '',
} = {}) {
  if (!rejectionReason) {
    throw new Error('rejection_reason is required by contracts/api-spec.md')
  }

  const mode = getDataSourceMode()

  if (mode === 'mock') {
    const targetIdx = inMemoryMockRecommendations.findIndex(
      (r) => r.recommendation_id === recommendationId
    )
    const targetRec = targetIdx !== -1 ? inMemoryMockRecommendations[targetIdx] : null
    const actionId = `ACT_REJ_${Date.now().toString().slice(-6)}`

    if (targetIdx !== -1) {
      inMemoryMockRecommendations[targetIdx] = {
        ...inMemoryMockRecommendations[targetIdx],
        _status: 'REJECTED',
        _actionId: actionId,
        _rejectionReason: rejectionReason,
        _notes: notes,
      }
    }

    const actionRecord = {
      action_id: actionId,
      alert_id: targetRec?.alert_id || 'ALT_20261009_007_01',
      recommendation_id: recommendationId,
      store_id: targetRec?.store_id || 'STORE_007',
      sku_id: targetRec?.sku_id || 'SKU_COLD_DRINK_750ML',
      action_type: targetRec?.option_type || 'TRANSFER',
      status: 'REJECTED',
      manager_id: managerId,
      notes: notes || `Recommendation rejected by manager: ${rejectionReason}`,
      rejection_reason: rejectionReason,
      cost_inr: 0.0,
      revenue_saved_inr: null,
      created_at: new Date().toISOString(),
      rejected_at: new Date().toISOString(),
      _source: 'mock',
    }

    inMemoryMockActionHistory.unshift(actionRecord)

    const result = {
      action_id: actionId,
      recommendation_id: recommendationId,
      status: 'REJECTED',
      rejected_at: new Date().toISOString(),
      remaining_pending_recommendations: inMemoryMockRecommendations
        .filter((r) => r.recommendation_id !== recommendationId && !r._status)
        .map((r) => r.recommendation_id),
      _source: 'mock',
    }

    return result
  }

  // Live Mode: POST /api/v1/recommendations/{recommendation_id}/reject
  const payload = {
    manager_id: managerId,
    rejection_reason: rejectionReason,
    notes,
  }

  const endpoint = API_ENDPOINTS.RECOMMENDATION_REJECT(recommendationId)
  const result = await apiClient(endpoint, {
    method: 'POST',
    body: payload,
  })

  return {
    ...result,
    _source: 'live',
  }
}

/**
 * Retrieve in-memory mock actions taken during this user session
 */
export function getInMemoryMockActionHistory() {
  return inMemoryMockActionHistory
}

/**
 * Reset in-memory mock state for test resetting
 */
export function resetMockState() {
  inMemoryMockAlerts = JSON.parse(JSON.stringify(MOCK_ALERTS))
  inMemoryMockRecommendations = JSON.parse(JSON.stringify(MOCK_RECOMMENDATIONS))
  inMemoryMockActionHistory = []
}

/**
 * Fetch hyper-local rider fleet status for a store
 */
export async function fetchRiderFleet(storeId) {
  const mode = getDataSourceMode()

  if (mode === 'mock') {
    return {
      source: 'mock',
      storeId,
      riderFleet: { ...MOCK_LOGISTICS_STATUS.rider_fleet },
    }
  }

  // Live Mode: GET /api/v1/logistics/riders?store_id={storeId}
  try {
    const data = await apiClient(API_ENDPOINTS.LOGISTICS_RIDERS, {
      params: { store_id: storeId },
    })

    return {
      source: 'live',
      storeId,
      riderFleet: data,
    }
  } catch (err) {
    console.warn(`[managerService] Failed to fetch rider fleet for ${storeId}:`, err)
    return {
      source: 'live',
      storeId,
      riderFleet: null,
      error: err,
    }
  }
}

/**
 * Fetch store inventory and SKU pricing
 */
export async function fetchStoreInventory(storeId, skuId = null) {
  const mode = getDataSourceMode()

  if (mode === 'mock') {
    return {
      source: 'mock',
      storeId,
      inventory: MOCK_STORE_INVENTORY,
    }
  }

  // Live Mode: GET /api/v1/stores/{store_id}/inventory
  try {
    const endpoint = API_ENDPOINTS.STORE_INVENTORY(storeId)
    const params = skuId ? { sku_id: skuId } : {}
    const data = await apiClient(endpoint, { params })

    return {
      source: 'live',
      storeId,
      inventory: data,
    }
  } catch (err) {
    console.warn(`[managerService] Failed to fetch store inventory for ${storeId}:`, err)
    return {
      source: 'live',
      storeId,
      inventory: null,
      error: err,
    }
  }
}
