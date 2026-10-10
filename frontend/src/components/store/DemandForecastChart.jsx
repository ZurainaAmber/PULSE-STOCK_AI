import React from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { Badge } from '../common/Badge'
import { TrendingUp, Clock, Info, AlertTriangle, ShieldCheck } from 'lucide-react'

export function DemandForecastChart({
  forecast = null,
  skuId = 'SKU_COLD_DRINK_750ML',
  skuName = 'Sparkling Cola 750ml',
  currentStock = 55,
  dataSourceMode = 'mock',
}) {
  const intervals = forecast?.intervals || []
  const isEmpty = intervals.length === 0

  // Format data for Recharts composed chart
  const chartData = intervals.map((item) => ({
    hour: item.hour_label || (item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hour'),
    baseline: item.baseline_demand_units ?? 0,
    cricket: item.cricket_uplift_units ?? 0,
    rain: item.rain_uplift_units ?? 0,
    festival: item.festival_uplift_units ?? 0,
    totalProjected: item.final_projected_demand_units ?? 0,
    lowerBound: item.confidence_lower_bound ?? null,
    upperBound: item.confidence_upper_bound ?? null,
  }))

  const peakPoint = chartData.reduce(
    (max, item) => (item.totalProjected > (max?.totalProjected || 0) ? item : max),
    null
  )

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">
                  Demand Uplift & Forecast Curve
                </CardTitle>
                <Badge
                  variant={dataSourceMode === 'mock' ? 'neutral' : 'primary'}
                  className="text-[10px]"
                >
                  {dataSourceMode === 'mock' ? 'Mock Data (5-Hour Window)' : 'Live GET /forecast/hourly'}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Hourly baseline demand with stacked external drivers (Cricket, Rain, Festival) for{' '}
                <strong className="text-slate-700">{skuName}</strong>.
              </CardDescription>
            </div>
          </div>

          {peakPoint && (
            <div className="flex items-center gap-2 text-xs font-mono bg-teal-50/70 border border-teal-200/80 px-2.5 py-1 rounded-lg">
              <span className="text-teal-700 font-semibold">Peak Demand:</span>
              <span className="font-bold text-teal-900">{peakPoint.totalProjected} units/hr</span>
              <span className="text-teal-600">({peakPoint.hour})</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {isEmpty ? (
          <div className="py-14 text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Info className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <div className="font-semibold text-slate-700 text-sm">
                Forecast Intervals Unavailable
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {dataSourceMode === 'live'
                  ? `GET /api/v1/forecast/hourly returned 0 forecast intervals for SKU ${skuId}. In accordance with contract specifications, no synthetic intervals are fabricated.`
                  : `No forecast simulation data configured for SKU ${skuId}.`}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* Horizon & Units Disclosure Header */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pb-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Horizon: <strong>{forecast?.horizonLabel || `${intervals.length}-Interval Projection`}</strong>
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">
                Units: Demand Units per Hour (units/hr)
              </span>
            </div>

            {/* Recharts Canvas */}
            <div className="h-64 sm:h-72 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  
                  <XAxis
                    dataKey="hour"
                    stroke="#94a3b8"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    label={{
                      value: 'Units/hr',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 12,
                      fontSize: 10,
                      fill: '#94a3b8',
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      fontSize: '11px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                    }}
                    formatter={(val, name) => {
                      const labels = {
                        baseline: 'Baseline Demand',
                        cricket: 'Cricket Uplift',
                        rain: 'Rain Uplift',
                        festival: 'Festival Uplift',
                        totalProjected: 'Final Projected Demand',
                        upperBound: 'Confidence Upper',
                        lowerBound: 'Confidence Lower',
                      }
                      return [`${val} units`, labels[name] || name]
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                    iconType="circle"
                    formatter={(val) => {
                      const labels = {
                        baseline: 'Baseline',
                        cricket: 'Cricket Uplift',
                        rain: 'Rain Uplift',
                        festival: 'Festival Uplift',
                        totalProjected: 'Total Demand',
                      }
                      return <span className="text-slate-600 text-[11px] font-medium">{labels[val] || val}</span>
                    }}
                  />

                  {/* Stacked Bars for Component Uplifts */}
                  <Bar dataKey="baseline" stackId="uplifts" fill="#cbd5e1" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="cricket" stackId="uplifts" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="rain" stackId="uplifts" fill="#0284c7" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="festival" stackId="uplifts" fill="#8b5cf6" radius={[4, 4, 0, 0]} />

                  {/* Projected Demand Curve */}
                  <Line
                    type="monotone"
                    dataKey="totalProjected"
                    stroke="#0f766e"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0f766e', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />

                  {/* Optional Current Stock Threshold */}
                  {currentStock && (
                    <ReferenceLine
                      y={currentStock}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Current Stock (${currentStock} Units)`,
                        position: 'insideTopLeft',
                        fill: '#dc2626',
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    />
                  )}

                  {/* Confidence Interval Upper and Lower Lines */}
                  {chartData[0]?.upperBound && (
                    <Line
                      type="monotone"
                      dataKey="upperBound"
                      stroke="#94a3b8"
                      strokeDasharray="2 2"
                      strokeWidth={1}
                      dot={false}
                    />
                  )}
                  {chartData[0]?.lowerBound && (
                    <Line
                      type="monotone"
                      dataKey="lowerBound"
                      stroke="#94a3b8"
                      strokeDasharray="2 2"
                      strokeWidth={1}
                      dot={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Explanatory Footnote */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                Red dashed line marks physical initial stock ({currentStock} units). Hourly demand above this triggers depletion.
              </span>
              <span className="text-slate-400">
                Confidence: ±12%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
