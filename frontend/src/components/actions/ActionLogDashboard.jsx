import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Info,
  ShieldCheck,
  Building2,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { ActionHistoryFilters } from './ActionHistoryFilters'
import { ActionHistoryTable } from './ActionHistoryTable'
import { ActionDetailModal } from './ActionDetailModal'
import {
  fetchActionHistory,
  resolveStoreName,
  resolveSkuName,
} from '../../services/actionsService'
import { getDataSourceMode } from '../../api/client'

export function ActionLogDashboard({ selectedStoreId, onSelectStore }) {
  const [data, setData] = useState({
    source: getDataSourceMode(),
    totalRecords: 0,
    actions: [],
    retrievedAt: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAction, setSelectedAction] = useState(null)

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [storeFilter, setStoreFilter] = useState('ALL')
  const [timeHorizon, setTimeHorizon] = useState('ALL')
  const [sortDirection, setSortDirection] = useState('desc') // 'desc' | 'asc'

  const dataSourceMode = getDataSourceMode()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch all records for store-agnostic client side ledger filtering
      const res = await fetchActionHistory({ limit: 100 })
      setData(res)
    } catch (err) {
      console.error('[ActionLogDashboard] Failed to fetch action history:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [dataSourceMode])

  useEffect(() => {
    loadData()
  }, [loadData, dataSourceMode])

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchQuery('')
    setStatusFilter('ALL')
    setTypeFilter('ALL')
    setStoreFilter('ALL')
    setTimeHorizon('ALL')
    setSortDirection('desc')
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    storeFilter !== 'ALL' ||
    timeHorizon !== 'ALL'

  // Filter and Sort Records
  const filteredActions = useMemo(() => {
    if (!data.actions) return []

    let list = [...data.actions]

    // 1. Text Search across identifiers, store/sku names, actors, and notes
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((item) => {
        const id = (item.action_id || '').toLowerCase()
        const alertId = (item.alert_id || '').toLowerCase()
        const recId = (item.recommendation_id || '').toLowerCase()
        const storeId = (item.store_id || '').toLowerCase()
        const storeName = resolveStoreName(item.store_id).toLowerCase()
        const skuId = (item.sku_id || '').toLowerCase()
        const skuName = resolveSkuName(item.sku_id).toLowerCase()
        const mgr = (item.manager_id || '').toLowerCase()
        const notes = (item.notes || '').toLowerCase()
        const type = (item.action_type || '').toLowerCase()
        const status = (item.status || '').toLowerCase()

        return (
          id.includes(q) ||
          alertId.includes(q) ||
          recId.includes(q) ||
          storeId.includes(q) ||
          storeName.includes(q) ||
          skuId.includes(q) ||
          skuName.includes(q) ||
          mgr.includes(q) ||
          notes.includes(q) ||
          type.includes(q) ||
          status.includes(q)
        )
      })
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
      list = list.filter((item) => item.status === statusFilter)
    }

    // 3. Action Type Filter
    if (typeFilter !== 'ALL') {
      list = list.filter((item) => item.action_type === typeFilter)
    }

    // 4. Store Filter
    if (storeFilter !== 'ALL') {
      list = list.filter((item) => item.store_id === storeFilter)
    }

    // 5. Time Horizon Filter
    if (timeHorizon !== 'ALL') {
      const now = Date.now()
      // If dataset timestamps are historic (e.g. October 2026 contract mocks),
      // gauge relative to the latest record in the dataset to keep filters functional
      const latestTs = list.reduce((max, item) => {
        const t = new Date(item.created_at).getTime()
        return !isNaN(t) && t > max ? t : max
      }, 0)
      const baseTime = latestTs > 0 && Math.abs(now - latestTs) > 86400000 ? latestTs : now

      let windowMs = 24 * 3600 * 1000
      if (timeHorizon === '1H') windowMs = 3600 * 1000
      if (timeHorizon === '6H') windowMs = 6 * 3600 * 1000
      if (timeHorizon === '24H') windowMs = 24 * 3600 * 1000

      list = list.filter((item) => {
        const t = new Date(item.created_at).getTime()
        if (isNaN(t)) return true
        return baseTime - t <= windowMs
      })
    }

    // 6. Sort Direction (Timestamp)
    list.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime() || 0
      const timeB = new Date(b.created_at).getTime() || 0
      return sortDirection === 'desc' ? timeB - timeA : timeA - timeB
    })

    return list
  }, [data.actions, searchQuery, statusFilter, typeFilter, storeFilter, timeHorizon, sortDirection])

  // Summary Metrics calculations
  const summaryMetrics = useMemo(() => {
    const actions = data.actions || []
    const approved = actions.filter((a) => a.status === 'APPROVED').length
    const executed = actions.filter((a) => a.status === 'EXECUTED').length
    const rejected = actions.filter((a) => a.status === 'REJECTED').length

    let totalCost = 0
    let totalRevenueSaved = 0
    let hasAnyRevenueSaved = false

    actions.forEach((a) => {
      if (typeof a.cost_inr === 'number' && a.status !== 'REJECTED') {
        totalCost += a.cost_inr
      }
      if (typeof a.revenue_saved_inr === 'number') {
        totalRevenueSaved += a.revenue_saved_inr
        hasAnyRevenueSaved = true
      }
    })

    return {
      total: actions.length,
      approved,
      executed,
      rejected,
      totalCost,
      totalRevenueSaved,
      hasAnyRevenueSaved,
    }
  }, [data.actions])

  return (
    <div className="space-y-6">
      {/* Top Banner: Overview and Provenance Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Action History & Governance Ledger
            </h2>
            <Badge variant={data.source === 'live' ? 'success' : 'neutral'} dot={true}>
              {data.source === 'live' ? 'Live API Connected' : 'Mock Mode Data'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sound audit trail of all manager approvals, rejections, and execution milestones.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs gap-1.5 h-8 text-slate-700 hover:text-teal-700 bg-white hover:bg-teal-50/50 border-slate-200/80"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            Refresh Ledger
          </Button>
        </div>
      </div>

      {/* Contract & Schema Integrity Banner */}
      {data.source === 'live' ? (
        <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/80 text-teal-950 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-teal-900">Live Backend Schema Note:</span>
            <p className="text-teal-800 leading-relaxed text-[11px]">
              Querying <code className="bg-teal-100/70 text-teal-900 px-1 py-0.5 rounded text-[10px] font-mono">GET /api/v1/actions/history</code>.
              The live SQLite <code className="bg-teal-100/70 text-teal-900 px-1 py-0.5 rounded text-[10px] font-mono">action_logs</code> table records
              execution costs (<code className="bg-teal-100/70 text-teal-900 px-1 py-0.5 rounded text-[10px] font-mono">cost_inr</code>), but does not store
              revenue saved. Values are displayed honestly as Unavailable rather than fabricated.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-slate-800 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-slate-900">Mock Mode Audit Integrity:</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Mock mode synthesizes canonical contract fixtures (<code className="bg-slate-200/60 px-1 py-0.5 rounded text-[10px] font-mono">contracts/api-spec.md Section 3.12</code>)
              with active session actions recorded on the Manager Dashboard. Approving or rejecting recommendations on the Manager Dashboard will immediately appear here.
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Actions */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Total Records</span>
            <FileText className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900">{summaryMetrics.total}</div>
          <div className="text-[10px] text-slate-500">In audit database</div>
        </div>

        {/* Approved Actions */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Approved</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-lg font-bold text-blue-600">{summaryMetrics.approved}</div>
          <div className="text-[10px] text-slate-500">Authorized decisions</div>
        </div>

        {/* Executed Actions */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Executed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-600">{summaryMetrics.executed}</div>
          <div className="text-[10px] text-slate-500">Physical receipt verified</div>
        </div>

        {/* Rejected Actions */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Rejected</span>
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-bold text-rose-600">{summaryMetrics.rejected}</div>
          <div className="text-[10px] text-slate-500">Declined by manager</div>
        </div>

        {/* Total Cost Incurred */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Execution Cost</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            ₹{summaryMetrics.totalCost.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500">Documented freight fee</div>
        </div>

        {/* Protected Revenue */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Protected Value</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            {summaryMetrics.hasAnyRevenueSaved ? (
              <span className="text-emerald-600">
                ₹{summaryMetrics.totalRevenueSaved.toLocaleString('en-IN')}
              </span>
            ) : (
              <span className="text-slate-400 text-sm font-normal">Unavailable</span>
            )}
          </div>
          <div className="text-[10px] text-slate-500">
            {summaryMetrics.hasAnyRevenueSaved ? 'Total saved revenue' : 'Not recorded in live DB'}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            Failed to Load Action History from Backend
          </div>
          <p className="text-xs text-rose-700">
            {error.message || 'Error querying /api/v1/actions/history. Please ensure the backend is running.'}
          </p>
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs border-rose-300 text-rose-700">
            Retry Connection
          </Button>
        </div>
      )}

      {/* Filter and Search Controls */}
      <ActionHistoryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        storeFilter={storeFilter}
        onStoreChange={setStoreFilter}
        timeHorizon={timeHorizon}
        onTimeHorizonChange={setTimeHorizon}
        sortDirection={sortDirection}
        onToggleSortDirection={() =>
          setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))
        }
        totalRecords={data.totalRecords || data.actions.length}
        filteredCount={filteredActions.length}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Audit Ledger Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
          <div className="text-xs font-medium text-slate-600">Loading audit trail records...</div>
        </div>
      ) : (
        <ActionHistoryTable
          actions={filteredActions}
          onSelectAction={setSelectedAction}
          onResetFilters={handleResetFilters}
        />
      )}

      {/* Detail Inspection Modal */}
      <ActionDetailModal
        action={selectedAction}
        isOpen={Boolean(selectedAction)}
        onClose={() => setSelectedAction(null)}
      />
    </div>
  )
}
