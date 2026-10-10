import React from 'react'
import {
  Bike,
  AlertTriangle,
  CloudRain,
  Zap,
  ShieldAlert,
  CheckCircle2,
  Users,
  Info
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { Badge } from '../common/Badge'

export function RiderCapacityCard({
  riders = null,
  events = null,
  storeId = 'STORE_007',
}) {
  const activeRiders = riders?.active_riders ?? riders?.available_riders ?? null
  const requiredRiders = riders?.required_riders_for_demand ?? riders?.required_riders ?? null
  const shortageCount = riders?.rider_shortage_count ?? null
  const shortageSeverity = riders?.shortage_severity ?? (shortageCount && shortageCount > 0 ? 'HIGH' : 'NONE')
  const surgeMultiplier = riders?.rider_surge_multiplier ?? 1.0

  // Authoritative Weather Check:
  // Do NOT assume surge is weather-related unless returned data contains an active rain event
  const isWeatherActive = Boolean(
    events?.weather?.is_active ||
    events?.active_events?.weather?.is_active ||
    (Array.isArray(events?.events) && events.events.some((e) => (e.event_type === 'RAIN' || e.event_type === 'WEATHER') && Boolean(e.is_active)))
  )

  const rainMmHr =
    events?.weather?.precipitation_mm_per_hr ||
    events?.active_events?.weather?.precipitation_mm_per_hr ||
    (Array.isArray(events?.events) && events.events.find((e) => e.event_type === 'RAIN')?.precipitation_mm_hr) ||
    null

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Rider Fleet Capacity & Deficit
                <Badge
                  variant={shortageCount && shortageCount > 0 ? 'danger' : 'success'}
                  dot={true}
                  className="text-[10px]"
                >
                  {shortageCount && shortageCount > 0 ? `${shortageSeverity} Severity` : 'Fleet Optimal'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Hyper-local dark store courier availability for last-mile delivery and inter-store transfers.
              </CardDescription>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
            Zone: {storeId}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {riders === null ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Rider fleet logistics data currently unavailable.
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 4 Metric Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              
              {/* 1. Active Couriers */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Active Couriers
                </span>
                <div className="mt-1 text-2xl font-black text-slate-900 tracking-tight">
                  {activeRiders !== null ? activeRiders : <span className="text-sm font-normal text-slate-400">Unavailable</span>}
                </div>
                <span className="text-[10px] text-slate-500">Currently on duty</span>
              </div>

              {/* 2. Required Couriers */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Required Couriers
                </span>
                <div className="mt-1 text-2xl font-black text-slate-900 tracking-tight">
                  {requiredRiders !== null ? requiredRiders : <span className="text-sm font-normal text-slate-400">Unavailable</span>}
                </div>
                <span className="text-[10px] text-slate-500">Peak demand target</span>
              </div>

              {/* 3. Courier Shortage */}
              <div className={`p-3 rounded-xl border ${shortageCount && shortageCount > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200/80'}`}>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Fleet Shortage
                </span>
                <div className={`mt-1 text-2xl font-black tracking-tight ${shortageCount && shortageCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {shortageCount !== null ? (
                    shortageCount > 0 ? `${shortageCount} short` : '0 (Optimal)'
                  ) : (
                    <span className="text-sm font-normal text-slate-400">Unavailable</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">
                  {shortageCount && shortageCount > 0 ? 'Severe dispatch deficit' : 'Normal coverage'}
                </span>
              </div>

              {/* 4. Surge Multiplier */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Surge Multiplier
                </span>
                <div className="mt-1 text-2xl font-black text-amber-600 tracking-tight flex items-center gap-1">
                  <span>{surgeMultiplier ? `${surgeMultiplier}x` : '1.0x'}</span>
                  {surgeMultiplier > 1.0 && <Zap className="w-4 h-4 text-amber-500 shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-500">
                  {surgeMultiplier > 1.0 ? 'Active delivery rate' : 'Standard flat rate'}
                </span>
              </div>

            </div>

            {/* Authoritative Surge Reasoning Banner */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
              {isWeatherActive ? (
                <>
                  <CloudRain className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">
                      Weather Attribution Confirmed:
                    </span>{' '}
                    Heavy precipitation active in {storeId} delivery radius ({rainMmHr ? `${rainMmHr} mm/hr` : 'active rain'}). The {surgeMultiplier}x surge multiplier is verified by active weather telemetry.
                  </div>
                </>
              ) : surgeMultiplier > 1.0 ? (
                <>
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">
                      Demand & Deficit Attribution:
                    </span>{' '}
                    No active precipitation event is recorded. The {surgeMultiplier}x surge multiplier is attributed strictly to high match order velocity and rider deficit ({shortageCount} riders short).
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-900">
                      Fleet Operating Normally:
                    </span>{' '}
                    Standard 1.0x baseline pricing applies. No weather disruptions or rider shortages detected.
                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  )
}
