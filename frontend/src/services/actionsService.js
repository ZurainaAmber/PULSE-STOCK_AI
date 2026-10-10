/**
 * PulseStock AI - Action History Audit Service
 * 
 * Sourced strictly from contracts/api-spec.md Section 3.12:
 * GET /api/v1/actions/history
 * 
 * Adheres to strict audit integrity:
 * - Live mode accesses real backend GET /api/v1/actions/history
 * - Mock mode uses canonical MOCK_ACTION_HISTORY plus in-memory session actions
 * - Transparently marks backend schema gaps (e.g. missing revenue_saved_inr in live DB)
 * - Read-only: no mutations, dispatches, or approvals executed here
 */

import { apiClient, getDataSourceMode } from '../api/client'
import { normalizeActionLog } from '../api/adapter'
import { API_ENDPOINTS, DEFAULT_CONTEXT } from '../constants/contracts'
import { MOCK_ACTION_HISTORY, MOCK_STORES, MOCK_STORE_INVENTORY } from '../mocks/mockData'
import { getInMemoryMockActionHistory } from './managerService'

// Store and SKU friendly names lookup
const STORE_NAME_MAP = {
  [DEFAULT_CONTEXT.STORE_ID]: DEFAULT_CONTEXT.STORE_NAME,
  STORE_007: 'Store 7 - Koramangala Tech Park',
  STORE_003: 'Store 3 - Indiranagar',
  STORE_012: 'Store 12 - HSR Layout',
}

const SKU_NAME_MAP = {
  [DEFAULT_CONTEXT.SKU_ID]: DEFAULT_CONTEXT.SKU_NAME,
  SKU_COLD_DRINK_750ML: 'Sparkling Cola 750ml',
  SKU_DIET_HERBAL_TEA_250ML: 'Diet Herbal Green Tea 250ml',
}

// Populate map from mock fixtures if available
if (Array.isArray(MOCK_STORES)) {
  MOCK_STORES.forEach((s) => {
    if (s.store_id && s.store_name) {
      STORE_NAME_MAP[s.store_id] = s.store_name
    }
  })
}

if (Array.isArray(MOCK_STORE_INVENTORY?.skus)) {
  MOCK_STORE_INVENTORY.skus.forEach((sku) => {
    if (sku.sku_id && sku.sku_name) {
      SKU_NAME_MAP[sku.sku_id] = sku.sku_name
    }
  })
}

export function resolveStoreName(storeId) {
  if (!storeId) return 'Unknown Store'
  return STORE_NAME_MAP[storeId] || `Store (${storeId})`
}

export function resolveSkuName(skuId) {
  if (!skuId) return 'Unknown SKU'
  return SKU_NAME_MAP[skuId] || `Product (${skuId})`
}

/**
 * Fetch action audit history records
 * 
 * @param {Object} options
 * @param {string|null} options.storeId - Optional store filter
 * @param {number} options.limit - Max records to fetch (default: 50)
 * @returns {Promise<{ source: 'live'|'mock', totalRecords: number, actions: Array, retrievedAt: string }>}
 */
export async function fetchActionHistory({ storeId = null, limit = 50 } = {}) {
  const mode = getDataSourceMode()

  if (mode === 'mock') {
    // 1. Combine session actions and pre-seeded mock history
    const sessionActions = getInMemoryMockActionHistory() || []
    const combined = [...sessionActions, ...MOCK_ACTION_HISTORY]

    // 2. De-duplicate by action_id preserving newest first
    const seen = new Set()
    const unique = []
    for (const item of combined) {
      const id = item.action_id || item._actionId
      if (id && !seen.has(id)) {
        seen.add(id)
        unique.push({
          ...item,
          _source: 'mock',
        })
      }
    }

    // 3. Optional store filter
    let filtered = unique
    if (storeId && storeId !== 'ALL') {
      filtered = unique.filter((a) => a.store_id === storeId)
    }

    const normalized = filtered.map(normalizeActionLog)

    return {
      source: 'mock',
      totalRecords: normalized.length,
      actions: normalized,
      retrievedAt: new Date().toISOString(),
    }
  }

  // Live Mode: GET /api/v1/actions/history
  const params = { limit }
  if (storeId && storeId !== 'ALL') {
    params.store_id = storeId
  }

  const data = await apiClient(API_ENDPOINTS.ACTIONS_HISTORY, { params })
  const rawActions = Array.isArray(data?.actions) ? data.actions : []
  const normalizedActions = rawActions.map((item) => ({
    ...normalizeActionLog(item),
    _source: 'live',
  }))

  return {
    source: 'live',
    totalRecords: data?.total_records ?? normalizedActions.length,
    actions: normalizedActions,
    retrievedAt: new Date().toISOString(),
  }
}
