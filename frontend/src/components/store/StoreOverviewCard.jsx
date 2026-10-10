import React from 'react'
import {
  Store,
  MapPin,
  Compass,
  AlertTriangle,
  ShieldCheck,
  Boxes,
  Package,
  Layers,
  ChevronDown
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { Badge } from '../common/Badge'
import { MOCK_STORES } from '../../mocks/mockData'

export function StoreOverviewCard({
  storeMetadata = {},
  selectedStoreId = 'STORE_007',
  onSelectStore,
  alerts = [],
  inventory = null,
  dataSourceMode = 'mock',
}) {
  const availableStores = MOCK_STORES

  // Compute store-level health metrics
  const activeAlert = alerts.find((a) => a.store_id === selectedStoreId) || alerts[0]
  const severity = activeAlert?.severity || storeMetadata?.severity || 'LOW'

  const skus = inventory?.skus || []
  let totalShelf = 0
  let totalCap = 0
  let lowShelfCount = 0
  let ghostStockoutCount = 0

  skus.forEach((s) => {
    const shelf = s.shelf_stock_units ?? 0
    const backroom = s.backroom_stock_units ?? 0
    const cap = s.shelf_capacity_units ?? 40
    totalShelf += shelf
    totalCap += cap

    if (shelf <= (s.safety_stock_threshold_units ?? 15)) {
      lowShelfCount++
    }
    if (shelf === 0 && backroom > 0) {
      ghostStockoutCount++
    }
  })

  const shelfFillRate = totalCap > 0 ? Math.round((totalShelf / totalCap) * 100) : null

  const severityBadgeVariants = {
    CRITICAL: 'danger',
    HIGH: 'warning',
    MEDIUM: 'primary',
    LOW: 'neutral',
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-4 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Store Identity & Location */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
              <Store className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <CardTitle className="text-lg">
                  {storeMetadata?.store_name || `Dark Store ${selectedStoreId}`}
                </CardTitle>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {selectedStoreId}
                </span>
                <Badge
                  variant={severityBadgeVariants[severity] || 'neutral'}
                  dot={true}
                  className="text-xs"
                >
                  {severity} Risk Status
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                {storeMetadata?.location_zone && (
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {storeMetadata.location_zone}
                  </span>
                )}
                {storeMetadata?.stadium_proximity_km !== null && storeMetadata?.stadium_proximity_km !== undefined && (
                  <span className="flex items-center gap-1 font-medium text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80">
                    <Compass className="w-3.5 h-3.5 text-teal-600" />
                    {storeMetadata.stadium_proximity_km} km to Chinnaswamy Stadium
                  </span>
                )}
                <span className="text-slate-400">
                  Source: {dataSourceMode === 'mock' ? 'Mock Fixture' : 'Live /stores endpoint'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Store Switcher Control */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            <label htmlFor="store-details-switcher" className="text-xs text-slate-500 font-medium">
              Active Store:
            </label>
            <div className="relative">
              <select
                id="store-details-switcher"
                value={selectedStoreId}
                onChange={(e) => onSelectStore && onSelectStore(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-slate-800 shadow-2xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
              >
                {availableStores.map((store) => (
                  <option key={store.store_id} value={store.store_id}>
                    {store.store_name} ({store.store_id})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>
      </CardHeader>

      {/* Bottom Health Bar Metrics */}
      <CardContent className="p-4 pt-3.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          
          {/* Active Alerts */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Stockout Alerts
            </span>
            <div className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>{alerts.length}</span>
              {alerts.length > 0 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
            </div>
            <span className="text-[10px] text-slate-500">
              {alerts.length > 0 ? `${alerts[0].severity} alert active` : 'No open stockout alerts'}
            </span>
          </div>

          {/* Total SKUs */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Catalog SKUs
            </span>
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {skus.length} <span className="text-xs font-normal text-slate-400">Tracked</span>
            </div>
            <span className="text-[10px] text-slate-500">
              Physical inventory items
            </span>
          </div>

          {/* Shelf Fill Rate */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Shelf Fill Ratio
            </span>
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {shelfFillRate !== null ? (
                `${shelfFillRate}%`
              ) : (
                <span className="text-sm font-normal text-slate-400">Unavailable</span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">
              {totalShelf} / {totalCap} Units Capacity
            </span>
          </div>

          {/* Ghost Out-of-Stock Status */}
          <div
            className={`p-3 rounded-xl border space-y-0.5 ${
              ghostStockoutCount > 0
                ? 'bg-rose-50 border-rose-200'
                : 'bg-slate-50 border border-slate-200/80'
            }`}
          >
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Ghost Stockouts
            </span>
            <div
              className={`text-xl font-black tracking-tight ${
                ghostStockoutCount > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {ghostStockoutCount > 0 ? `${ghostStockoutCount} SKUs` : '0 (Clear)'}
            </div>
            <span className="text-[10px] text-slate-500">
              {ghostStockoutCount > 0 ? 'Shelf empty with backroom stock' : 'No shelf-backroom bottlenecks'}
            </span>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
