import React, { useState } from 'react'
import {
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
  RefreshCw,
  Search
} from 'lucide-react'
import clsx from 'clsx'
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card'
import { SEVERITY_THEME } from '../../constants/theme'
import { ALERT_SEVERITY } from '../../constants/contracts'

const SEVERITY_ORDER = {
  [ALERT_SEVERITY.CRITICAL]: 1,
  [ALERT_SEVERITY.HIGH]: 2,
  [ALERT_SEVERITY.MEDIUM]: 3,
  [ALERT_SEVERITY.LOW]: 4,
}

export function AlertQueue({
  alerts = [],
  selectedAlertId,
  onSelectAlert,
  loading = false,
  error = null,
  onRefresh,
}) {
  const [filterSeverity, setFilterSeverity] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Rank alerts according to documented severity rules and urgency (minutes to stockout)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const rankA = SEVERITY_ORDER[a.severity] || 99
    const rankB = SEVERITY_ORDER[b.severity] || 99
    if (rankA !== rankB) return rankA - rankB
    return (a.minutes_until_stockout ?? 999) - (b.minutes_until_stockout ?? 999)
  })

  const filteredAlerts = sortedAlerts.filter((alert) => {
    if (filterSeverity !== 'ALL' && alert.severity !== filterSeverity) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchStore = (alert.store_name || alert.store_id || '').toLowerCase().includes(q)
      const matchSku = (alert.sku_name || alert.sku_id || '').toLowerCase().includes(q)
      const matchId = (alert.alert_id || '').toLowerCase().includes(q)
      return matchStore || matchSku || matchId
    }
    return true
  })

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Ranked Alert Queue ({alerts.length})
            </CardTitle>
          </div>
          <button
            onClick={onRefresh}
            title="Refresh alerts queue"
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin text-teal-600')} />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by store or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-400 text-slate-800 placeholder-slate-400"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-400 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-3 flex-1 overflow-y-auto space-y-2.5 max-h-[560px]">
        {loading && (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-5 h-5 mx-auto animate-spin text-teal-600" />
            <span>Loading active 4-hour alerts...</span>
          </div>
        )}

        {!loading && error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Failed to load alerts
            </div>
            <p className="text-[11px] text-rose-600">{error.message || String(error)}</p>
          </div>
        )}

        {!loading && !error && filteredAlerts.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 opacity-60" />
            <p className="font-medium text-slate-600">No stockout alerts matching filter</p>
            <p className="text-[11px]">All retail stores currently within safe buffer thresholds.</p>
          </div>
        )}

        {!loading &&
          !error &&
          filteredAlerts.map((alert, idx) => {
            const isSelected = alert.alert_id === selectedAlertId
            const sevTheme = SEVERITY_THEME[alert.severity] || SEVERITY_THEME[ALERT_SEVERITY.LOW]
            const shelfUnits = alert.shelf_stock_units ?? '—'
            const backroomUnits = alert.backroom_stock_units ?? '—'
            const totalStock = alert.current_total_stock_units ?? alert.current_total_stock ?? 0

            return (
              <button
                key={alert.alert_id}
                onClick={() => onSelectAlert(alert)}
                className={clsx(
                  'w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer relative text-xs',
                  isSelected
                    ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/25 shadow-xs'
                    : 'border-slate-200/80 hover:border-teal-300/80 bg-white hover:bg-slate-50/70'
                )}
              >
                {/* Header row: Alert ID + Severity */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-slate-600">
                      #{idx + 1} {alert.alert_id}
                    </span>
                    {alert.shelf_replenishment_alert && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        SHELF REPLENISH
                      </span>
                    )}
                  </div>
                  <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', sevTheme.badgeClass)}>
                    {alert.severity}
                  </span>
                </div>

                {/* Store Name & Target SKU */}
                <div className="font-bold text-slate-900 text-xs truncate">
                  {alert.store_name || alert.store_id}
                </div>
                <div className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">
                  {alert.sku_name || alert.sku_id}
                </div>

                {/* Inventory breakdown pill: Shelf vs Backroom */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="text-slate-500 flex items-center gap-1 font-mono">
                    <span>Shelf: <strong>{shelfUnits}u</strong></span>
                    <span>•</span>
                    <span>Backroom: <strong>{backroomUnits}u</strong></span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Stockout In</span>
                    <span className={clsx('font-extrabold', alert.minutes_until_stockout <= 60 ? 'text-rose-600' : 'text-amber-600')}>
                      {alert.minutes_until_stockout ? `${alert.minutes_until_stockout} mins` : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Primary Driver & Stockout Probability */}
                {alert.primary_driver && (
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    <span className="truncate">Driver: <strong className="text-slate-600">{alert.primary_driver}</strong></span>
                    {alert.stockout_probability && (
                      <span className="font-bold text-slate-700 shrink-0 ml-1">
                        {(alert.stockout_probability * 100).toFixed(0)}% risk
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
      </CardContent>
    </Card>
  )
}
