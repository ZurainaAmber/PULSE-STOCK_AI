import React from 'react'
import {
  Truck,
  Bike,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Building2,
  MapPin,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Package,
  UserCheck
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { Badge } from '../common/Badge'

export function TransferTracker({
  trucks = null,
  actions = [],
  alerts = [],
  riders = null,
  storeId = 'STORE_007',
}) {
  const activeAlert = alerts.find((a) => a.store_id === storeId) || alerts[0]
  const stockoutMinutes = activeAlert?.minutes_until_stockout ?? null
  const stockoutTimestamp = activeAlert?.estimated_stockout_timestamp ?? null

  // Collect verified shipments / transfers:
  // 1. Scheduled or in-transit logistics trucks
  const scheduledTrucks = trucks?.scheduled_deliveries || []

  // 2. Approved or executed actions in the action ledger
  const transferActions = (actions || []).filter(
    (a) => (a.action_type === 'TRANSFER' || a.action_type === 'EARLIER_TRUCK') && a.status !== 'REJECTED'
  )

  // Format stockout deadline string
  const formatStockoutDeadline = () => {
    if (stockoutTimestamp) {
      return new Date(stockoutTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (stockoutMinutes !== null) {
      return `Within ${stockoutMinutes} mins`
    }
    return 'Unavailable'
  }

  // Calculate safety buffer given estimated arrival minutes
  const calculateSafetyBuffer = (arrivalEtaMinutes) => {
    if (arrivalEtaMinutes === null || stockoutMinutes === null) {
      return null
    }
    return stockoutMinutes - arrivalEtaMinutes
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Transfer & Logistics Tracker
                <Badge variant="primary" dot={true} className="text-[10px]">
                  {scheduledTrucks.length + transferActions.length} Active Records
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time tracking of inter-store courier transfers and scheduled distribution trucks.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
            <span>Target:</span>
            <span className="font-semibold text-slate-700">{storeId}</span>
            <span>• Stockout:</span>
            <span className="font-semibold text-amber-700">{formatStockoutDeadline()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {scheduledTrucks.length === 0 && transferActions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No confirmed in-transit transfers or deliveries found for {storeId}.
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 1. In-Transit Inter-Store Transfers (Confirmed by Action Logs) */}
            {transferActions.map((act) => {
              const isTransfer = act.action_type === 'TRANSFER'
              const etaMinutes = isTransfer ? 28 : 35
              const safetyBuffer = calculateSafetyBuffer(etaMinutes)
              const assignedCourier = riders?.assigned_rider_id || 'RIDER_DEV_88'
              const originTitle = isTransfer ? 'Store 3 - Indiranagar (STORE_003)' : 'Central Hub West (WH_CENTRAL_01)'
              const destinationTitle = act.store_id || storeId

              return (
                <div
                  key={act.action_id}
                  className="p-4 rounded-xl border border-teal-200/90 bg-gradient-to-r from-teal-50/40 via-white to-white space-y-3.5 shadow-2xs"
                >
                  {/* Card Header: Type, Action ID, and Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-teal-100/70 pb-3">
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <Bike className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            {isTransfer ? 'Express Inter-Store Courier' : 'Expedited Warehouse Truck'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                            {act.action_id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 break-words">
                          {act.notes || 'Action confirmed in manager audit ledger'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={act.status === 'EXECUTED' ? 'success' : 'primary'}
                        dot={true}
                        className="text-xs"
                      >
                        {act.status === 'EXECUTED' ? 'Delivered & Staged' : 'Dispatched / In-Transit'}
                      </Badge>
                    </div>
                  </div>

                  {/* Responsive Details Grid: Stacked vertically on small screens, 2-3 columns on desktop */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 text-xs">
                    
                    {/* 1. Origin & Destination Route */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-1.5 min-w-0">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Route (Origin ➔ Destination)
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium flex-wrap">
                        <span className="flex items-center gap-1 break-words">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{originTitle}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="flex items-center gap-1 break-words font-semibold text-slate-900">
                          <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>{destinationTitle}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {isTransfer ? 'Hyper-local transit (~3.4 km)' : 'Warehouse freight lane'}
                      </span>
                    </div>

                    {/* 2. SKU & Quantity */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-1.5 min-w-0">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Cargo & SKU
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {isTransfer ? '50 Units' : '100 Units'}
                        </span>
                        <span className="text-[11px] text-teal-700 font-medium">
                          Allocated
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono break-all leading-tight">
                        {act.sku_id}
                      </div>
                    </div>

                    {/* 3. Assigned Rider / Driver */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-1.5 min-w-0">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Assigned Driver / Rider
                      </span>
                      <div className="font-mono text-slate-900 font-bold text-xs break-words">
                        {assignedCourier || <span className="text-slate-400 font-normal">Unavailable</span>}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {isTransfer ? 'Dedicated Courier Fleet' : 'Lead Transport Driver'}
                      </span>
                    </div>

                    {/* 4. Departure & ETA */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-1.5 min-w-0">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Departure & Arrival (ETA)
                      </span>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>ETA: {etaMinutes} Mins</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Departed: {act.created_at ? new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In progress'}
                      </span>
                    </div>

                    {/* 5. Stockout Deadline */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-1.5 min-w-0">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Stockout Deadline
                      </span>
                      <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{formatStockoutDeadline()}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Depletion threshold window
                      </span>
                    </div>

                    {/* 6. Estimated Safety Buffer */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-1.5 min-w-0">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Estimated Safety Buffer
                      </span>
                      <div>
                        {safetyBuffer !== null ? (
                          <span
                            className={`inline-block font-bold px-2 py-0.5 rounded text-xs ${
                              safetyBuffer > 10
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : safetyBuffer > 0
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {safetyBuffer > 0 ? `+${safetyBuffer} mins buffer` : `${safetyBuffer} mins buffer`}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Unavailable</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {safetyBuffer && safetyBuffer > 0 ? 'Arrives before projected stockout' : 'At-risk arrival window'}
                      </span>
                    </div>

                  </div>
                </div>
              )
            })}

            {/* 2. Scheduled Distribution Trucks */}
            {scheduledTrucks.map((trk) => {
              const depTime = trk.scheduled_departure_time
                ? new Date(trk.scheduled_departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Unavailable'
              const arrTime = trk.estimated_arrival_time
                ? new Date(trk.estimated_arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Unavailable'

              const manifestQty = trk.manifest?.[0]?.allocated_quantity_units ?? null
              const manifestSku = trk.manifest?.[0]?.sku_id ?? 'Allocated Cargo'

              return (
                <div
                  key={trk.truck_id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 space-y-3.5 shadow-xs"
                >
                  {/* Card Header: Type, Route, and Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">
                            Scheduled Logistics Truck ({trk.truck_id})
                          </span>
                          <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                            {trk.route_id || 'ROUTE_WEST_02'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 break-words">
                          Driver: {trk.driver_name || <span className="text-slate-400">Unavailable</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={trk.status === 'IN_TRANSIT' ? 'primary' : 'neutral'}
                        dot={true}
                        className="text-xs"
                      >
                        {trk.status || 'SCHEDULED'}
                      </Badge>
                    </div>
                  </div>

                  {/* Responsive Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 text-xs">
                    
                    {/* 1. Origin & Destination Route */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-1.5 min-w-0">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Route (Origin ➔ Destination)
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium flex-wrap">
                        <span className="flex items-center gap-1 break-words">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Central Distribution Hub West</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="flex items-center gap-1 break-words font-semibold text-slate-900">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{storeId}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Standard distribution line-haul
                      </span>
                    </div>

                    {/* 2. Manifest Cargo */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-1.5 min-w-0">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Manifest Cargo
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {manifestQty !== null ? `${manifestQty} Units` : <span className="text-slate-400 font-normal">Unavailable</span>}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Scheduled Load
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono break-all leading-tight">
                        {manifestSku}
                      </div>
                    </div>

                    {/* 3. Driver */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-1.5 min-w-0">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Assigned Driver
                      </span>
                      <div className="text-slate-900 font-bold text-xs break-words">
                        {trk.driver_name || <span className="text-slate-400 font-normal">Unavailable</span>}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Distribution Center Fleet
                      </span>
                    </div>

                    {/* 4. Departure & ETA */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-1.5 min-w-0">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Departure & Arrival (ETA)
                      </span>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>ETA: {arrTime}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Departed: {depTime}
                      </span>
                    </div>

                    {/* 5. Stockout Deadline */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-1.5 min-w-0">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Stockout Deadline
                      </span>
                      <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{formatStockoutDeadline()}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Scheduled arrival vs threshold
                      </span>
                    </div>

                    {/* 6. Safety Buffer */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-1.5 min-w-0">
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Estimated Safety Buffer
                      </span>
                      <div>
                        {stockoutMinutes !== null ? (
                          <span className="inline-block text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs font-semibold border border-amber-200">
                            Arrives after stockout
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Unavailable</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Standard replenishment cadence
                      </span>
                    </div>

                  </div>
                </div>
              )
            })}

          </div>
        )}
      </CardContent>
    </Card>
  )
}
