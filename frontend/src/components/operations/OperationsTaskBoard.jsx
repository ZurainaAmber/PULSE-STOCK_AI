import React, { useState } from 'react'
import {
  Layers,
  ArrowRight,
  Clock,
  AlertTriangle,
  Truck,
  Bike,
  Package,
  CheckCircle2,
  Filter,
  Info,
  ShieldAlert
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { Badge } from '../common/Badge'

export function OperationsTaskBoard({ tasks = [], dataSourceMode = 'mock' }) {
  const [filterType, setFilterType] = useState('ALL')

  const filteredTasks = filterType === 'ALL'
    ? tasks
    : tasks.filter((t) => t.type === filterType)

  const typeIcons = {
    SHELF_REPLENISHMENT: Package,
    INCOMING_TRUCK_RECEIPT: Truck,
    STOCK_TRANSFER: ArrowRight,
    RIDER_REALLOCATION: Bike,
  }

  const priorityVariants = {
    CRITICAL: 'danger',
    HIGH: 'warning',
    MEDIUM: 'primary',
    NORMAL: 'neutral',
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Operations Task Board
                <Badge variant="neutral" className="text-[10px]">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Derived directly from shelf inventory, logistics manifests, and rider capacity telemetry.
              </CardDescription>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setFilterType('SHELF_REPLENISHMENT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'SHELF_REPLENISHMENT'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Shelf ({tasks.filter((t) => t.type === 'SHELF_REPLENISHMENT').length})
            </button>
            <button
              onClick={() => setFilterType('INCOMING_TRUCK_RECEIPT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'INCOMING_TRUCK_RECEIPT'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Trucks ({tasks.filter((t) => t.type === 'INCOMING_TRUCK_RECEIPT').length})
            </button>
            <button
              onClick={() => setFilterType('STOCK_TRANSFER')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'STOCK_TRANSFER'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Transfers ({tasks.filter((t) => t.type === 'STOCK_TRANSFER').length})
            </button>
            <button
              onClick={() => setFilterType('RIDER_REALLOCATION')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterType === 'RIDER_REALLOCATION'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Riders ({tasks.filter((t) => t.type === 'RIDER_REALLOCATION').length})
            </button>
          </div>
        </div>

        {/* Actionability Disclosure Banner */}
        <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>
            <strong>Actionability Note:</strong> Tasks below represent physical dark store operations and delivery telemetry. In strict alignment with backend API specifications, informational cards are monitored automatically without synthetic action buttons.
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No active operational tasks matching the selected filter.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const Icon = typeIcons[task.type] || Package
            const badgeVariant = priorityVariants[task.priority] || 'neutral'

            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  task.isGhostStockout
                    ? 'bg-rose-50/60 border-rose-200 ring-1 ring-rose-400/20'
                    : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 min-w-0">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        task.isGhostStockout
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : task.priority === 'CRITICAL' || task.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm break-words">
                          {task.title}
                        </span>
                        <Badge variant={badgeVariant} dot={true} className="text-[10px] shrink-0">
                          {task.priority}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {task.storeId}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 break-words leading-relaxed">
                        {task.details}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-1.5 shrink-0 pl-11 md:pl-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 max-w-full md:max-w-[280px]">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">{task.timingInfo}</span>
                    </div>

                    <span className="text-[10px] text-slate-600 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80 text-left md:text-right break-words leading-tight">
                      {task.actionabilityLabel}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
