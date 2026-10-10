import React from 'react'
import {
  Sparkles,
  Trophy,
  CloudRain,
  Gift,
  Clock,
  Compass,
  AlertCircle,
  TrendingUp,
  Info
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { Badge } from '../common/Badge'

export function ActiveEventsCard({
  events = null,
  storeId = 'STORE_007',
  dataSourceMode = 'mock',
}) {
  const activeEventsObj = events?.active_events || {}
  const rawEventsList = events?._rawEvents || events?.events || []

  // Extract individual drivers
  const cricket = activeEventsObj.cricket_match || null
  const weather = activeEventsObj.weather || null
  const festival = activeEventsObj.festival || null

  const hasEvents = Boolean(cricket || weather || festival || rawEventsList.length > 0)

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                Active External Events & Demand Drivers
                <Badge variant="primary" dot={true} className="text-[10px]">
                  {dataSourceMode === 'mock' ? 'Mock Context' : 'Live GET /events/context'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time external demand drivers influencing store footfall and category surge.
              </CardDescription>
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80 shrink-0">
            Zone: {storeId}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {!hasEvents ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No active external events or demand surges recorded for {storeId}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Cricket Match Driver */}
            {cricket && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3 flex flex-col justify-between shadow-2xs">
                <div className="space-y-3">
                  {/* Card Header: Icon, Title, and Status Badge */}
                  <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-amber-200/60">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 text-sm block leading-snug break-words">
                          {cricket.title || 'Cricket Match'}
                        </span>
                        <span className="text-xs text-slate-500 block break-words mt-0.5">
                          {cricket.stadium_name || 'Nearby Stadium'}
                        </span>
                      </div>
                    </div>
                    <Badge variant="warning" dot={true} className="text-[10px] shrink-0 whitespace-nowrap">
                      {cricket.status || 'Active'}
                    </Badge>
                  </div>

                  {/* Metrics List */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-xs py-1 border-b border-amber-100/60">
                      <span className="text-slate-600 font-medium">Demand Uplift:</span>
                      <span className="font-black text-amber-800 font-mono text-sm shrink-0">
                        {cricket.category_uplift_multiplier || cricket.multiplier || 1.0}x
                      </span>
                    </div>

                    {cricket.distance_km !== undefined && (
                      <div className="flex items-center justify-between text-xs text-slate-600 py-0.5">
                        <span>Venue Proximity:</span>
                        <span className="font-semibold text-slate-800 font-mono shrink-0">
                          {cricket.distance_km} km to venue
                        </span>
                      </div>
                    )}

                    {cricket.current_match_phase && (
                      <div className="flex items-center justify-between text-xs text-slate-600 py-0.5">
                        <span>Match Phase:</span>
                        <span className="font-semibold text-slate-800 shrink-0">
                          {cricket.current_match_phase}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operational Impact Note */}
                <div className="p-2.5 rounded-lg bg-white/90 border border-amber-200/70 text-xs text-slate-600 leading-relaxed break-words">
                  <span className="font-semibold text-slate-800">Operational Impact:</span> Concentrated demand surge across cold drinks and snacks during match phase intervals.
                </div>
              </div>
            )}

            {/* 2. Weather & Rain Driver */}
            {weather && (
              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/40 space-y-3 flex flex-col justify-between shadow-2xs">
                <div className="space-y-3">
                  {/* Card Header: Icon, Title, and Precipitation Badge */}
                  <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-sky-200/60">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                        <CloudRain className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 text-sm block leading-snug break-words">
                          {weather.condition || 'Rain Disruption'}
                        </span>
                        <span className="text-xs text-slate-500 block break-words mt-0.5">
                          Localized Precipitation
                        </span>
                      </div>
                    </div>
                    <Badge variant="info" dot={true} className="text-[10px] shrink-0 whitespace-nowrap">
                      {weather.precipitation_mm_per_hr || weather.precipitation_mm_hr ? `${weather.precipitation_mm_per_hr || weather.precipitation_mm_hr} mm/hr` : 'Rain Active'}
                    </Badge>
                  </div>

                  {/* Metrics List */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-xs py-1 border-b border-sky-100/60">
                      <span className="text-slate-600 font-medium">Demand Multiplier:</span>
                      <span className="font-black text-sky-800 font-mono text-sm shrink-0">
                        {weather.category_uplift_multiplier || weather.multiplier || 1.0}x
                      </span>
                    </div>

                    {weather.delivery_speed_reduction_pct !== undefined && (
                      <div className="flex items-center justify-between text-xs text-slate-600 py-0.5">
                        <span>Speed Impact:</span>
                        <span className="font-semibold text-rose-600 font-mono shrink-0">
                          -{weather.delivery_speed_reduction_pct}% rider velocity
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-600 py-0.5">
                      <span>Condition:</span>
                      <span className="font-semibold text-slate-800 shrink-0">
                        {weather.condition || 'Moderate to Heavy'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operational Impact Note */}
                <div className="p-2.5 rounded-lg bg-white/90 border border-sky-200/70 text-xs text-slate-600 leading-relaxed break-words">
                  <span className="font-semibold text-slate-800">Operational Impact:</span> Heavy rain reduces footfall and shifts customer volume onto dark store delivery couriers.
                </div>
              </div>
            )}

            {/* 3. Festival Shopping Driver */}
            {festival && (
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3 flex flex-col justify-between shadow-2xs">
                <div className="space-y-3">
                  {/* Card Header: Icon, Title, and Category Badge */}
                  <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-purple-200/60">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 text-sm block leading-snug break-words">
                          {festival.festival_name || festival.title || 'Festival Shopping'}
                        </span>
                        <span className="text-xs text-slate-500 block break-words mt-0.5">
                          Seasonal Shopping Rush
                        </span>
                      </div>
                    </div>
                    <Badge variant="purple" dot={true} className="text-[10px] shrink-0 whitespace-nowrap">
                      Seasonal
                    </Badge>
                  </div>

                  {/* Metrics List */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-xs py-1 border-b border-purple-100/60">
                      <span className="text-slate-600 font-medium">Category Uplift:</span>
                      <span className="font-black text-purple-800 font-mono text-sm shrink-0">
                        {festival.category_uplift_multiplier || festival.multiplier || 1.0}x
                      </span>
                    </div>

                    {festival.peak_category && (
                      <div className="flex items-center justify-between text-xs text-slate-600 py-0.5">
                        <span>Lead Category:</span>
                        <span className="font-semibold text-slate-800 shrink-0">
                          {festival.peak_category}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-600 py-0.5">
                      <span>Window:</span>
                      <span className="font-semibold text-slate-800 shrink-0">
                        Pre-Holiday Peak
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operational Impact Note */}
                <div className="p-2.5 rounded-lg bg-white/90 border border-purple-200/70 text-xs text-slate-600 leading-relaxed break-words">
                  <span className="font-semibold text-slate-800">Operational Impact:</span> Sustained multi-day shopping volume across snack, beverage, and gift item inventories.
                </div>
              </div>
            )}

            {/* Fallback for live flat events list */}
            {!cricket && !weather && !festival && rawEventsList.map((evt) => (
              <div
                key={evt.event_id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-slate-200">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 text-sm block leading-snug break-words">
                        {evt.title || evt.event_type}
                      </span>
                      <span className="text-xs text-slate-500 block break-words mt-0.5 font-mono">
                        {evt.event_id}
                      </span>
                    </div>
                    <Badge variant="neutral" className="text-[10px] shrink-0">
                      {evt.event_type}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-600 font-medium">Multiplier:</span>
                      <span className="font-black text-slate-900 font-mono text-sm shrink-0">
                        {evt.multiplier || 1.0}x
                      </span>
                    </div>
                    {evt.precipitation_mm_hr > 0 && (
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Precipitation:</span>
                        <span className="font-semibold text-blue-700 font-mono shrink-0">
                          {evt.precipitation_mm_hr} mm/hr
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-500 break-words">
                  Active demand driver for store {storeId}.
                </div>
              </div>
            ))}

          </div>
        )}
      </CardContent>
    </Card>
  )
}
