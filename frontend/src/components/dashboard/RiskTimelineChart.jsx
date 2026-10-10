import React from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { Clock, TrendingDown, Info } from 'lucide-react'

export function RiskTimelineChart({
  forecastData = [],
  horizonLabel = '5-Hour Forecast Window (Contract Horizon)',
  initialStock = 55,
  stockoutMinutes = 42,
  storeName = 'Store 7 - Koramangala',
  skuName = 'Sparkling Cola 750ml',
}) {
  // Compute cumulative stock depletion over the forecasted intervals
  let runningStock = initialStock
  const enrichedData = (forecastData || []).map((interval) => {
    const demand = interval.final_projected_demand_units ?? 0
    const prevStock = runningStock
    runningStock = Math.max(0, runningStock - demand)

    return {
      ...interval,
      remaining_stock_units: prevStock,
      end_interval_stock_units: runningStock,
    }
  })

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Demand & Stock Depletion Trajectory
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              {horizonLabel}
            </span>
          </div>
          <CardTitle className="text-sm mt-0.5">
            {storeName} • {skuName}
          </CardTitle>
          <CardDescription className="text-[11px]">
            Baseline demand vs dynamic event uplift curve compared with remaining stock.
          </CardDescription>
        </div>

        <div className="flex items-center gap-3 text-xs bg-rose-50/70 border border-rose-200/80 px-3 py-1.5 rounded-xl text-rose-700 font-semibold shrink-0">
          <Clock className="w-4 h-4 text-rose-600" />
          <div>
            <span className="text-[10px] text-rose-500 uppercase tracking-wider block font-bold">Estimated 0 Stock</span>
            <span>{stockoutMinutes} minutes</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        {enrichedData.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <Info className="w-6 h-6 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">No hourly forecast intervals available</p>
            <p className="text-[11px]">Live Decision Engine currently pending backend integration.</p>
          </div>
        ) : (
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={enrichedData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                
                <XAxis
                  dataKey="hour_label"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                />
                
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  label={{ value: 'Units', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8', dy: 20 }}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1.5 min-w-[180px]">
                          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">
                            {label}
                          </div>
                          <div className="flex justify-between text-teal-700 font-semibold">
                            <span>Projected Demand:</span>
                            <span>{data.final_projected_demand_units} units</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Baseline Demand:</span>
                            <span>{data.baseline_demand_units} units</span>
                          </div>
                          {data.cricket_uplift_units > 0 && (
                            <div className="flex justify-between text-amber-600 text-[11px]">
                              <span>Cricket Uplift:</span>
                              <span>+{data.cricket_uplift_units} units</span>
                            </div>
                          )}
                          {data.rain_uplift_units > 0 && (
                            <div className="flex justify-between text-sky-600 text-[11px]">
                              <span>Rain Uplift:</span>
                              <span>+{data.rain_uplift_units} units</span>
                            </div>
                          )}
                          <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-slate-100">
                            <span>Est. Stock Remaining:</span>
                            <span>{data.end_interval_stock_units} units</span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />

                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                />

                {/* Reference line for stockout danger zero threshold */}
                <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1.5} label={{ value: 'Stockout Threshold (0)', fill: '#ef4444', fontSize: 10 }} />

                {/* Final Projected Demand Bars */}
                <Bar
                  dataKey="final_projected_demand_units"
                  name="Projected Demand (Units/Hr)"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                />

                {/* Baseline Demand Line */}
                <Line
                  type="monotone"
                  dataKey="baseline_demand_units"
                  name="Baseline Demand"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />

                {/* Remaining Stock Line */}
                <Line
                  type="monotone"
                  dataKey="remaining_stock_units"
                  name="Depleting Store Stock"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#ef4444' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1.5">
          <span>* Multiplicative demand includes active Cricket Match (2.5x) and Heavy Rain (1.35x).</span>
          <span className="font-semibold text-slate-700">Shelf capacity: 40 units • Backroom buffer: 20 units</span>
        </div>
      </CardContent>
    </Card>
  )
}
