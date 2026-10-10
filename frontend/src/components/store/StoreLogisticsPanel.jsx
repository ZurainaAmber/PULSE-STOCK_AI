import React from 'react'
import {
  Building2,
  Warehouse,
  Truck,
  ArrowRight,
  Clock,
  MapPin,
  ShieldCheck,
  Package,
  Layers,
  HelpCircle
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { Badge } from '../common/Badge'

export function StoreLogisticsPanel({
  warehouse = null,
  donors = [],
  trucks = null,
  targetSkuId = 'SKU_COLD_DRINK_750ML',
  storeId = 'STORE_007',
}) {
  const scheduledDeliveries = trucks?.scheduled_deliveries || []
  const expeditedOption = trucks?.expedited_option || null

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/60 text-teal-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Supporting Supply Network & Replenishment Feeds
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Central warehouse stock, inter-store donor surplus, and inbound logistics trucks for{' '}
                <strong className="text-slate-800 font-mono font-semibold">{targetSkuId}</strong>.
              </CardDescription>
            </div>
          </div>

          <span className="text-[11px] font-mono text-teal-800 bg-teal-50/80 px-2.5 py-1 rounded-md border border-teal-200/60 font-semibold tracking-wide">
            Read-Only Telemetry
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Central Warehouse Availability */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block leading-tight">
                      {warehouse?.warehouse_name || 'Central Distribution Hub'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {warehouse?.warehouse_id || 'WH_CENTRAL_01'}
                    </span>
                  </div>
                </div>
                <Badge variant="primary" className="text-[10px]">
                  Warehouse
                </Badge>
              </div>

              {warehouse ? (
                <div className="space-y-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Free Stock:</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {(warehouse.free_stock_units ?? warehouse.available_stock_units ?? 0).toLocaleString()} Units
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Total Available:</span>
                      <span>{(warehouse.available_stock_units ?? 0).toLocaleString()}</span>
                    </div>
                    {warehouse.reserved_stock_units !== undefined && (
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Reserved:</span>
                        <span>{(warehouse.reserved_stock_units ?? 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Standard Transit:</span>
                      <span className="font-semibold text-slate-700">
                        {warehouse.standard_transit_time_minutes ?? 60} mins
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Next Slot:</span>
                      <span className="font-mono text-[10px] text-slate-600">
                        {warehouse.next_dispatch_window
                          ? new Date(warehouse.next_dispatch_window).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Standard Schedule'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-xs py-4 text-center">
                  Warehouse stock data unavailable for this SKU.
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-2">
              Primary central supply pipeline.
            </div>
          </div>

          {/* 2. Nearby Donor Dark Stores */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block leading-tight">
                      Nearby Donor Stores
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Surplus Stock Feasibility
                    </span>
                  </div>
                </div>
                <Badge variant="mint" className="text-[10px]">
                  {donors.length} Available
                </Badge>
              </div>

              {donors.length === 0 ? (
                <div className="text-slate-400 text-xs py-6 text-center">
                  No nearby donor dark stores with surplus stock for {targetSkuId}.
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {donors.slice(0, 2).map((d) => (
                    <div
                      key={d.donor_store_id}
                      className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="truncate">{d.donor_store_name || d.donor_store_id}</span>
                        <span className="text-emerald-700 font-semibold shrink-0">
                          +{d.surplus_units ?? '0'} Surplus
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Distance: {d.distance_km ?? '3.5'} km</span>
                        <span>ETA: {d.transfer_eta_minutes ?? '28'} mins</span>
                      </div>
                      {d.estimated_transfer_cost_inr !== undefined && (
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Courier Cost:</span>
                          <span className="font-mono">₹{d.estimated_transfer_cost_inr}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-2">
              Supports point-to-point courier inter-store transfers.
            </div>
          </div>

          {/* 3. Inbound Delivery Trucks */}
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-xs block leading-tight">
                      Inbound Logistics Trucks
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Line-Haul Schedule
                    </span>
                  </div>
                </div>
                <Badge variant="info" className="text-[10px]">
                  {scheduledDeliveries.length} Deliveries
                </Badge>
              </div>

              {scheduledDeliveries.length === 0 ? (
                <div className="text-slate-400 text-xs py-6 text-center">
                  No inbound line-haul trucks scheduled for this store.
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {scheduledDeliveries.slice(0, 2).map((trk) => {
                    const arrTime = trk.estimated_arrival_time
                      ? new Date(trk.estimated_arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Pending'
                    const manifestUnits = trk.manifest?.[0]?.allocated_quantity_units ?? 'Allocated'

                    return (
                      <div
                        key={trk.truck_id}
                        className="p-2.5 rounded-lg bg-white border border-slate-200/80 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{trk.truck_id}</span>
                          <Badge
                            variant={trk.status === 'IN_TRANSIT' ? 'primary' : 'neutral'}
                            className="text-[9px]"
                          >
                            {trk.status || 'SCHEDULED'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Route: {trk.route_id || 'ROUTE_WEST_02'}</span>
                          <span>Arrival: {arrTime}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Cargo: {manifestUnits} Units • Driver: {trk.driver_name || 'Assigned Driver'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-2">
              Dock receiving bay schedule.
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
