import React from 'react'
import {
  Layers,
  Truck,
  Bike,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  TrendingDown
} from 'lucide-react'
import { Card, CardHeader } from '../common/Card'

export function OperationsKpiSummary({
  tasksCount = 0,
  activeDeliveriesCount = 0,
  riderShortages = null,
  riderSurge = 1.0,
  shelfFillPercent = null,
  hasGhostStockout = false,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Floor Tasks Pending */}
      <Card hover={true} className="border-teal-100 ring-1 ring-teal-500/10 bg-white">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Floor Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {tasksCount} <span className="text-sm font-semibold text-slate-400">Tasks</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded text-[10px] border border-teal-200">
              Active Queue
            </span>
            <span className="truncate">Shelf restock & dock receipts</span>
          </div>
        </CardHeader>
      </Card>

      {/* 2. In-Transit Deliveries */}
      <Card hover={true} className="border-sky-100 ring-1 ring-sky-500/10 bg-white">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>In-Transit Deliveries</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 text-2xl font-black text-sky-700 tracking-tight">
            {activeDeliveriesCount} <span className="text-sm font-semibold text-slate-400">Shipments</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded text-[10px] border border-sky-200">
              En Route
            </span>
            <span className="truncate">Express courier & line-haul truck</span>
          </div>
        </CardHeader>
      </Card>

      {/* 3. Rider Deficit & Surge */}
      <Card hover={true} className="border-amber-100 ring-1 ring-amber-500/10 bg-white">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Rider Deficit</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {riderShortages !== null && riderShortages !== undefined ? (
              riderShortages > 0 ? (
                <>
                  {riderShortages} <span className="text-xs font-semibold text-rose-600 font-mono">short</span>
                </>
              ) : (
                <span className="text-emerald-600 text-xl font-bold">0 (Optimal)</span>
              )
            ) : (
              <span className="text-slate-400 text-lg font-medium">Unavailable</span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            {riderSurge && riderSurge > 1.0 ? (
              <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border border-amber-200">
                {riderSurge}x Surge Active
              </span>
            ) : (
              <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">
                Standard Rate
              </span>
            )}
            <span className="truncate">Courier dispatch status</span>
          </div>
        </CardHeader>
      </Card>

      {/* 4. Shelf Capacity Fill Rate */}
      <Card hover={true} className={hasGhostStockout ? "border-rose-200 ring-1 ring-rose-500/20 bg-white" : "border-emerald-100 ring-1 ring-emerald-500/10 bg-white"}>
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Shelf Utilization</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${hasGhostStockout ? 'bg-rose-50 border border-rose-200 text-rose-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'}`}>
              <Boxes className="w-4 h-4" />
            </div>
          </div>

          <div className={`mt-2 text-2xl font-black tracking-tight ${hasGhostStockout ? 'text-rose-600' : 'text-slate-900'}`}>
            {shelfFillPercent !== null ? (
              <>
                {shelfFillPercent}% <span className="text-xs font-semibold text-slate-400">Filled</span>
              </>
            ) : (
              <span className="text-slate-400 text-lg font-medium">Unavailable</span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            {hasGhostStockout ? (
              <span className="font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-[10px] border border-rose-200">
                Ghost Stockout Alert!
              </span>
            ) : (
              <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
                Healthy Space
              </span>
            )}
            <span className="truncate">Physical picking capacity</span>
          </div>
        </CardHeader>
      </Card>

    </div>
  )
}
