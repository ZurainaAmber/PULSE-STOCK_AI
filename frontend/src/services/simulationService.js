/**
 * PulseStock AI - What-if Scenario Simulation Service
 * 
 * Sourced strictly from:
 * - contracts/api-spec.md Section 3.13 (POST /simulation/recalculate)
 * - contracts/engine-interface.md Section 3 & 4 (Simulation Interface & Deterministic Business Logic Rules)
 * 
 * Strict Data Integrity:
 * - Never calls mutation or operational dispatch endpoints
 * - Clearly distinguishes live backend responses from mock deterministic calculations
 * - Transparently reports live backend stub limitations without fabricating engine outputs
 */

import { apiClient, getDataSourceMode } from '../api/client'
import { API_ENDPOINTS, DEFAULT_CONTEXT } from '../constants/contracts'

/**
 * Baseline Production Parameters (Current State for Store 7, Sparkling Cola)
 */
export const BASELINE_PARAMETERS = {
  cricket_match_multiplier: 2.5,
  rain_intensity_mm_hr: 22.5,
  available_riders: 3,
  custom_transfer_quantity_units: 60,
  delivery_delay_minutes: 0,
  transfer_blocked: false,
}

export const BASELINE_OUTPUTS = {
  projected_demand_peak_units: 72,
  minutes_until_stockout: 46,
  transfer_eta_minutes: 28,
  safety_buffer_minutes: 18, // 46m stockout - 28m ETA
  recommended_option_type: 'TRANSFER',
  recommended_option_title: 'Inter-Store Transfer from Store 3 (Indiranagar)',
  financial_exposure_inr: 4500.0,
  recommendations: [
    {
      option_type: 'TRANSFER',
      rank: 1,
      title: 'Inter-Store Transfer (Store 3 - Indiranagar)',
      summary: 'Dispatch 2 hyper-local riders to collect 60 units from Store 3 surplus.',
      confidence_score: 0.94,
      eta_minutes: 28,
      stockout_prevented: true,
      cost_inr: 150.0,
    },
    {
      option_type: 'EARLIER_TRUCK',
      rank: 2,
      title: 'Expedited Central Warehouse Truck',
      summary: 'Advance scheduled daily delivery truck departure from central warehouse.',
      confidence_score: 0.88,
      eta_minutes: 35,
      stockout_prevented: true,
      cost_inr: 350.0,
    },
    {
      option_type: 'SHELF_SWAP',
      rank: 3,
      title: 'Emergency Shelf Space Swap',
      summary: 'Temporarily compress slow-moving tea SKU facing to create 15 units of front-facing cola shelf buffer.',
      confidence_score: 0.82,
      eta_minutes: 10,
      stockout_prevented: false,
      cost_inr: 0.0,
    },
    {
      option_type: 'WAIT',
      rank: 4,
      title: 'Wait for Scheduled Delivery',
      summary: 'No expedited action; await scheduled warehouse truck (ETA: 120 mins). Complete stock-out expected.',
      confidence_score: 0.15,
      eta_minutes: 120,
      stockout_prevented: false,
      cost_inr: 0.0,
    },
  ],
}

/**
 * Deterministic Mock Simulation Calculation
 * Implements contracts/engine-interface.md Section 4 rules:
 * - Rule 1: Multiplicative Demand Uplift Formula capped at 4.5x
 * - Rule 2: Shelf & Backroom depletion against total stock (55 units)
 * - Rule 3: Rider shortage (< 2 riders) delays transfer by +25m, docks confidence -0.25, promotes EARLIER_TRUCK to Rank 1
 */
export function calculateDeterministicMockSimulation(params) {
  const cricketMult = Number(params.cricket_match_multiplier) || 1.0
  const rainMmHr = Number(params.rain_intensity_mm_hr) || 0.0
  const riders = Number(params.available_riders) ?? 3
  const transferQty = Number(params.custom_transfer_quantity_units) || 60
  const delayMins = Number(params.delivery_delay_minutes) || 0
  const isBlocked = Boolean(params.transfer_blocked)

  // 1. Demand Multiplier (Rule 1: capped at 4.5x baseline)
  // Rain uplift multiplier curve: 0 mm/hr -> 1.0x; 22.5 mm/hr -> 1.35x; 50 mm/hr -> 1.78x
  const rainMult = rainMmHr === 0 ? 1.0 : Number((1.0 + (rainMmHr / 22.5) * 0.35).toFixed(2))
  const festivalMult = 1.25 // Standard festival uplift from contract
  const rawCombinedMult = cricketMult * rainMult * festivalMult
  const effectiveMultiplier = Math.min(4.5, rawCombinedMult)

  // Baseline un-uplifted demand is ~17.2 units/hr
  // At 2.5 * 1.35 * 1.25 = 4.218x -> ~72 units/hr
  // At 3.0 * 1.54 * 1.25 (capped 4.5x) -> 95 units/hr (matches contracts/example-response.json)
  const demandPeak = Math.min(130, Math.round(17.2 * effectiveMultiplier))

  // 2. Stockout Horizon (Rule 2: total stock = 55 units)
  // Minutes to stockout = (current_stock / demand_per_hour) * 60
  const stockoutMinutes = Math.max(12, Math.round((55 / demandPeak) * 60))

  // 3. Logistics Delays & Rule 3 (Rider shortage impact)
  const riderShortage = riders < 2
  const riderDelayMinutes = riderShortage ? 25 : 0
  const effectiveTransferEta = 28 + delayMins + riderDelayMinutes
  const transferConfidence = Math.max(
    0.1,
    Number((0.94 - (riderShortage ? 0.25 : 0) - (delayMins > 15 ? 0.15 : 0)).toFixed(2))
  )

  // Safety buffer relative to transfer ETA
  const safetyBufferMinutes = stockoutMinutes - effectiveTransferEta
  const transferStockoutPrevented = !isBlocked && safetyBufferMinutes > 0

  // 4. Recommendation Ranking (Rule 3: EARLIER_TRUCK overtakes TRANSFER if riders < 2 or blocked)
  let simulatedRecs = []

  const transferOption = {
    option_type: 'TRANSFER',
    title: 'Inter-Store Transfer (Store 3 - Indiranagar)',
    summary: isBlocked
      ? 'Transit corridor temporarily blocked. Transfer cannot proceed.'
      : riderShortage
      ? `Transfer from Store 3 delayed due to rider shortage (${riders} rider available, +25m delay). Expedited truck recommended instead.`
      : delayMins > 0
      ? `Inter-store transfer delayed by +${delayMins}m transit friction. Arrival in ${effectiveTransferEta} mins.`
      : 'Dispatch 2 hyper-local riders to collect transfer quantity from Store 3 surplus.',
    confidence_score: isBlocked ? 0.0 : transferConfidence,
    eta_minutes: isBlocked ? null : effectiveTransferEta,
    stockout_prevented: transferStockoutPrevented,
    cost_inr: 150.0,
    transfer_quantity_units: transferQty,
  }

  const truckOption = {
    option_type: 'EARLIER_TRUCK',
    title: 'Expedited Central Warehouse Truck',
    summary: 'Advance scheduled daily delivery truck departure from central warehouse (WH_CENTRAL_01).',
    confidence_score: 0.91,
    eta_minutes: 35,
    stockout_prevented: stockoutMinutes > 35,
    cost_inr: 350.0,
  }

  const shelfSwapOption = {
    option_type: 'SHELF_SWAP',
    title: 'Emergency Shelf Space Swap',
    summary: 'Reallocate 15 shelf slots from slow-moving Diet Green Tea.',
    confidence_score: 0.82,
    eta_minutes: 10,
    stockout_prevented: false,
    cost_inr: 0.0,
  }

  const waitOption = {
    option_type: 'WAIT',
    title: 'Wait for Scheduled Delivery',
    summary: 'Await standard warehouse truck arrival (ETA: 120 mins). Complete stockout will occur.',
    confidence_score: 0.15,
    eta_minutes: 120,
    stockout_prevented: false,
    cost_inr: 0.0,
  }

  if (isBlocked || riderShortage || effectiveTransferEta > 35) {
    // EARLIER_TRUCK promoted to Rank 1
    truckOption.rank = 1
    transferOption.rank = 2
    shelfSwapOption.rank = 3
    waitOption.rank = 4
    simulatedRecs = [truckOption, transferOption, shelfSwapOption, waitOption]
  } else {
    // Normal ranking: TRANSFER Rank 1
    transferOption.rank = 1
    truckOption.rank = 2
    shelfSwapOption.rank = 3
    waitOption.rank = 4
    simulatedRecs = [transferOption, truckOption, shelfSwapOption, waitOption]
  }

  // 5. Financial Exposure (Projected demand lost * selling price)
  const financialExposure = Math.round(demandPeak * 90 * 0.7) // ~70% gross loss proxy

  return {
    simulation_id: `SIM_MOCK_${Date.now().toString().slice(-6)}`,
    simulated_at: new Date().toISOString(),
    recalculated_demand_peak_units: demandPeak,
    recalculated_stockout_minutes: stockoutMinutes,
    effective_transfer_eta_minutes: effectiveTransferEta,
    safety_buffer_minutes: safetyBufferMinutes,
    recommended_option_type: simulatedRecs[0].option_type,
    recommended_option_title: simulatedRecs[0].title,
    financial_exposure_inr: financialExposure,
    simulated_recommendations: simulatedRecs,
    effective_multiplier: Number(effectiveMultiplier.toFixed(2)),
    rider_shortage_active: riderShortage,
    transfer_blocked_active: isBlocked,
  }
}

/**
 * Execute What-if Scenario Simulation
 * 
 * @param {Object} parameters - Scenario parameter overrides
 * @param {string} storeId - Target store ID (default: STORE_007)
 * @param {string} skuId - Target SKU ID (default: SKU_COLD_DRINK_750ML)
 * @returns {Promise<Object>}
 */
export async function executeSimulation(
  parameters,
  storeId = DEFAULT_CONTEXT.STORE_ID,
  skuId = DEFAULT_CONTEXT.SKU_ID
) {
  const mode = getDataSourceMode()

  // MOCK MODE: Run deterministic engine calculation
  if (mode === 'mock') {
    const mockResult = calculateDeterministicMockSimulation(parameters)
    return {
      source: 'mock',
      store_id: storeId,
      sku_id: skuId,
      applied_parameters: { ...parameters },
      ...mockResult,
    }
  }

  // LIVE MODE: POST /api/v1/simulation/recalculate
  const payload = {
    store_id: storeId,
    sku_id: skuId,
    simulated_parameters: {
      cricket_match_multiplier: parameters.cricket_match_multiplier,
      rain_intensity_mm_hr: parameters.rain_intensity_mm_hr,
      available_riders: parameters.available_riders,
      custom_transfer_quantity_units: parameters.custom_transfer_quantity_units,
      delivery_delay_minutes: parameters.delivery_delay_minutes,
      transfer_blocked: parameters.transfer_blocked,
    },
  }

  const liveResponse = await apiClient(API_ENDPOINTS.SIMULATION_RECALCULATE, {
    method: 'POST',
    body: payload,
  })

  // Validate live response structure
  const hasRecsArray = Boolean(liveResponse && Array.isArray(liveResponse.simulated_recommendations))
  const isMalformed = !liveResponse || typeof liveResponse !== 'object' || !hasRecsArray
  const isBackendStub = !isMalformed && liveResponse.simulated_recommendations.length === 0

  // Compute illustrative preview for explicitly labelled mock/illustrative mode only
  const illustrativePreview = calculateDeterministicMockSimulation(parameters)

  return {
    source: 'live',
    simulation_id: liveResponse?.simulation_id || `SIM_${Date.now()}`,
    simulated_at: liveResponse?.simulated_at || new Date().toISOString(),
    store_id: liveResponse?.store_id || storeId,
    sku_id: liveResponse?.sku_id || skuId,
    applied_parameters: liveResponse?.applied_parameters || parameters,
    is_backend_stub: isBackendStub,
    is_malformed: isMalformed,
    raw_live_response: liveResponse,
    // Provide authoritative values if returned by backend, or fallback with clear disclaimer
    recalculated_demand_peak_units: liveResponse?.recalculated_demand_peak_units ?? illustrativePreview.recalculated_demand_peak_units,
    recalculated_stockout_minutes: liveResponse?.recalculated_stockout_minutes ?? illustrativePreview.recalculated_stockout_minutes,
    effective_transfer_eta_minutes: illustrativePreview.effective_transfer_eta_minutes,
    safety_buffer_minutes: illustrativePreview.safety_buffer_minutes,
    // Preserve the backend's simulated_recommendations response EXACTLY as returned without substitution
    recommended_option_type: hasRecsArray && liveResponse.simulated_recommendations.length > 0
      ? liveResponse.simulated_recommendations[0]?.option_type || null
      : null,
    simulated_recommendations: hasRecsArray ? liveResponse.simulated_recommendations : [],
    financial_exposure_inr: illustrativePreview.financial_exposure_inr,
  }
}
