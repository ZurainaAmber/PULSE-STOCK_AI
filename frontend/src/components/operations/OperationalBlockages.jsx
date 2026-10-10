import React from 'react'
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Bike,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  ArrowRight
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { Badge } from '../common/Badge'

export function OperationalBlockages({
  inventory = null,
  riders = null,
  alerts = [],
  trucks = null,
  storeId = 'STORE_007',
}) {
  const blockages = []

  // 1. Ghost Out-of-Stock Blockage
  if (inventory?.skus) {
    inventory.skus.forEach((sku) => {
      const shelf = sku.shelf_stock_units ?? 0
      const backroom = sku.backroom_stock_units ?? 0
      if (shelf === 0 && backroom > 0) {
        blockages.push({
          id: `BLOCKAGE_GHOST_${sku.sku_id}`,
          severity: 'CRITICAL',
          title: `Ghost Out-of-Stock: ${sku.sku_name || sku.sku_id}`,
          description: `Customer picking shelf is completely empty while ${backroom} units sit idle in the dark store backroom. Immediate floor transfer required.`,
          impact: 'Direct customer order cancellations at picking stage',
          remedy: `Move up to ${Math.min(sku.shelf_capacity_units || 40, backroom)} units to front shelf immediately`,
        })
      }
    })
  }

  // 2. Rider Fleet Shortage Blockage
  const riderShortage = riders?.rider_shortage_count ?? 0
  if (riderShortage > 0) {
    blockages.push({
      id: `BLOCKAGE_RIDER_${storeId}`,
      severity: riders?.shortage_severity === 'HIGH' ? 'CRITICAL' : 'HIGH',
      title: `Rider Fleet Deficit: ${riderShortage} Couriers Short`,
      description: `Only ${riders?.active_riders ?? 0} couriers active against ${riders?.required_riders_for_demand ?? riders?.required_riders ?? 0} required for projected order peak.`,
      impact: `Delivery delays, dispatch backlogs, and surge rate (${riders?.rider_surge_multiplier || 1.0}x) triggered`,
      remedy: 'Reallocate floating fleet from adjacent zones or prioritize batch order clustering',
    })
  }

  // 3. Imminent Stockout Horizon Blockage
  const activeAlert = alerts.find((a) => a.store_id === storeId) || alerts[0]
  if (activeAlert && (activeAlert.minutes_until_stockout ?? 999) <= 60) {
    blockages.push({
      id: `BLOCKAGE_STOCKOUT_${activeAlert.alert_id}`,
      severity: 'CRITICAL',
      title: `Imminent Stockout: ${activeAlert.sku_name || activeAlert.sku_id || 'Primary SKU'}`,
      description: `Projected inventory depletion within ${activeAlert.minutes_until_stockout} minutes at current peak sales run-rate (${activeAlert.projected_hourly_demand_units || activeAlert.projected_hourly_demand} units/hr).`,
      impact: 'Unmitigated loss of ₹4,500 gross revenue and stockout penalty',
      remedy: 'Approve inter-store transfer from Store 3 or expedite warehouse truck on Manager Dashboard',
    })
  }

  // 4. Transit Lag vs Stockout Deadline
  const scheduledTrucks = trucks?.scheduled_deliveries || []
  if (scheduledTrucks.length > 0 && activeAlert?.minutes_until_stockout) {
    const stockoutMins = activeAlert.minutes_until_stockout
    // Standard truck takes ~120 mins, whereas stockout is within e.g. 42 mins
    if (stockoutMins < 90) {
      blockages.push({
        id: `BLOCKAGE_TRANSIT_LAG_${storeId}`,
        severity: 'HIGH',
        title: 'Standard Truck Replenishment Lag',
        description: `Scheduled distribution truck TRK_STANDARD_404 arrives after the projected stockout deadline (${stockoutMins} mins vs ~120 mins truck transit).`,
        impact: 'Standard scheduled truck cannot prevent the initial stockout window',
        remedy: 'Requires express point-to-point courier or expedited warehouse truck option (25-35 mins)',
      })
    }
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Operational Blockages & Bottlenecks
                <Badge
                  variant={blockages.length > 0 ? 'danger' : 'success'}
                  dot={true}
                  className="text-[10px]"
                >
                  {blockages.length} Active {blockages.length === 1 ? 'Blockage' : 'Blockages'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Active friction points that threaten picking velocity, delivery SLA, or inventory continuity.
              </CardDescription>
            </div>
          </div>

          <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
            Automated Bottleneck Detection
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {blockages.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">No Operational Blockages Detected:</span> All dark store systems, shelf picking ratios, courier allocations, and delivery schedules are within normal tolerances.
            </div>
          </div>
        ) : (
          blockages.map((b) => (
            <div
              key={b.id}
              className={`p-3.5 rounded-xl border space-y-2 ${
                b.severity === 'CRITICAL'
                  ? 'bg-rose-50/50 border-rose-200'
                  : 'bg-amber-50/50 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      b.severity === 'CRITICAL' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    {b.title}
                  </span>
                </div>
                <Badge
                  variant={b.severity === 'CRITICAL' ? 'danger' : 'warning'}
                  className="text-[10px]"
                >
                  {b.severity} Risk
                </Badge>
              </div>

              <p className="text-xs text-slate-600">
                {b.description}
              </p>

              <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]">
                <div className="text-slate-500">
                  <span className="font-semibold text-slate-700">Operational Impact:</span> {b.impact}
                </div>
                <div className="text-teal-800 font-medium bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  <span className="font-semibold text-slate-900">Remedy:</span> {b.remedy}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
