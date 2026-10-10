import React from 'react'
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Zap,
  CheckCircle2,
  XCircle,
  DollarSign,
  AlertTriangle,
} from 'lucide-react'
import { Badge } from '../common/Badge'
import { BASELINE_OUTPUTS } from '../../services/simulationService'

export function ComparisonView({
  simulatedResult,
  parameters,
}) {
  if (!simulatedResult) return null

  // Metric 1: Peak Demand
  const baselinePeak = BASELINE_OUTPUTS.projected_demand_peak_units
  const simPeak = simulatedResult.recalculated_demand_peak_units ?? baselinePeak
  const peakDiff = simPeak - baselinePeak
  const peakPct = Math.round((peakDiff / baselinePeak) * 100)

  // Metric 2: Stockout Time
  const baselineStockout = BASELINE_OUTPUTS.minutes_until_stockout
  const simStockout = simulatedResult.recalculated_stockout_minutes ?? baselineStockout
  const stockoutDiff = simStockout - baselineStockout

  // Metric 3: Logistics ETA & Buffer
  const baselineEta = BASELINE_OUTPUTS.transfer_eta_minutes
  const simEta = simulatedResult.effective_transfer_eta_minutes ?? baselineEta
  const baselineBuffer = BASELINE_OUTPUTS.safety_buffer_minutes
  const simBuffer = simulatedResult.safety_buffer_minutes ?? (simStockout - simEta)
  const isBufferBreached = simBuffer <= 0

  // Metric 4: Strategy
  const baselineOption = BASELINE_OUTPUTS.recommended_option_type
  const isLiveStub = simulatedResult.source === 'live' && (simulatedResult.is_backend_stub || simulatedResult.is_malformed || !simulatedResult.recommended_option_type)
  const simOption = isLiveStub ? null : (simulatedResult.recommended_option_type ?? baselineOption)
  const isStrategyChanged = Boolean(simOption && baselineOption !== simOption)

  // Metric 5: Financial Exposure
  const baselineExposure = BASELINE_OUTPUTS.financial_exposure_inr
  const simExposure = simulatedResult.financial_exposure_inr ?? baselineExposure
  const exposureDiff = simExposure - baselineExposure

  return (
    <div className="space-y-4">
      {/* Comparative Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Projected Demand Peak */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              Peak Demand Rate
            </span>
            {peakDiff !== 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  peakDiff > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {peakDiff > 0 ? `+${peakDiff}` : peakDiff} units ({peakDiff > 0 ? `+${peakPct}%` : `${peakPct}%`})
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">Baseline</div>
              <div className="text-lg font-bold text-slate-700">{baselinePeak}</div>
              <div className="text-[10px] text-slate-400">units/hour</div>
            </div>

            <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200/80">
              <div className="text-[10px] text-teal-800 font-medium">Simulated</div>
              <div className="text-lg font-bold text-teal-950">{simPeak}</div>
              <div className="text-[10px] text-teal-700">units/hour</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            {peakDiff > 0
              ? 'Multiplied demand uplift elevates hourly sales velocity.'
              : peakDiff < 0
              ? 'Reduced external drivers slow down inventory burn.'
              : 'Demand pace identical to baseline.'}
          </p>
        </div>

        {/* Card 2: Stockout Time Window */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Minutes to Stockout
            </span>
            {stockoutDiff !== 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  stockoutDiff < 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {stockoutDiff < 0 ? `${stockoutDiff} mins earlier` : `+${stockoutDiff} mins delayed`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">Baseline</div>
              <div className="text-lg font-bold text-slate-700">{baselineStockout}m</div>
              <div className="text-[10px] text-slate-400">at 55 units stock</div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              <div className="text-[10px] text-amber-700 font-medium">Simulated</div>
              <div className={`text-lg font-bold ${simStockout < 30 ? 'text-rose-600' : 'text-amber-900'}`}>
                {simStockout}m
              </div>
              <div className="text-[10px] text-amber-700">urgency threshold</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            {simStockout < 30
              ? 'Critical urgency: shelf depletion accelerated below 30 minutes!'
              : 'Inventory provides adequate breathing room for logistics dispatch.'}
          </p>
        </div>

        {/* Card 3: Logistics ETA & Safety Buffer */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Safety Buffer (Margin)
            </span>
            {isBufferBreached ? (
              <Badge variant="critical" size="sm">
                Buffer Deficit!
              </Badge>
            ) : (
              <Badge variant="success" size="sm">
                Buffer Positive
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">Baseline Buffer</div>
              <div className="text-lg font-bold text-emerald-700">+{baselineBuffer}m</div>
              <div className="text-[10px] text-slate-400">ETA {baselineEta}m vs {baselineStockout}m</div>
            </div>

            <div
              className={`p-2.5 rounded-xl border ${
                isBufferBreached
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/60 border-emerald-100 text-emerald-900'
              }`}
            >
              <div className="text-[10px] font-medium opacity-80">Simulated Buffer</div>
              <div className={`text-lg font-bold ${isBufferBreached ? 'text-rose-600' : 'text-emerald-700'}`}>
                {simBuffer >= 0 ? `+${simBuffer}m` : `${simBuffer}m`}
              </div>
              <div className="text-[10px] opacity-80">
                ETA {simEta ? `${simEta}m` : 'Blocked'} vs {simStockout}m
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            {isBufferBreached
              ? 'Deficit breach! Goods arrive after stockout occurs without expedited truck.'
              : 'Transfer safely reaches destination before inventory runs empty.'}
          </p>
        </div>

        {/* Card 4: Top Recommended Strategy */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-500" />
              Engine Strategy Recommendation
            </span>
            {isLiveStub ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Unavailable from Live Engine
              </span>
            ) : isStrategyChanged ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Strategy Swapped
              </span>
            ) : (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                Strategy Preserved
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[10px] text-slate-400 font-medium">Baseline #1</div>
              <div className="text-xs font-bold text-slate-800 mt-1 line-clamp-2">
                Inter-Store Transfer
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Store 3 Surplus</div>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
              <div className="text-[10px] text-purple-700 font-medium">Simulated #1</div>
              <div className="text-xs font-bold text-purple-900 mt-1 line-clamp-2">
                {isLiveStub
                  ? (simulatedResult.is_malformed ? 'Unavailable (Malformed Engine Response)' : 'Unavailable (Backend Stub)')
                  : simOption === 'EARLIER_TRUCK'
                  ? 'Expedited Warehouse Truck'
                  : simOption === 'TRANSFER'
                  ? 'Inter-Store Transfer'
                  : simOption || 'No Recommendation'}
              </div>
              <div className="text-[10px] text-purple-700 mt-0.5">
                {isLiveStub
                  ? (simulatedResult.is_malformed ? 'Invalid Payload' : 'Empty Live Response')
                  : isStrategyChanged
                  ? 'Promoted by Engine'
                  : 'Optimal Path'}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            {isLiveStub
              ? (simulatedResult.is_malformed
                  ? 'The live endpoint returned a response without valid recommendations.'
                  : 'The live endpoint completed with 0 recommendations for this scenario.')
              : isStrategyChanged
              ? 'Rider shortage or corridor obstruction automatically promoted warehouse truck dispatch.'
              : 'Inter-store transfer remains the most cost-effective solution.'}
          </p>
        </div>
      </div>

      {/* Assumptions vs Outputs Disclosure Bar */}
      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Recalculation Audit Trail
          </span>
          <div className="text-slate-700 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              Applied Overrides: Cricket <b>{parameters.cricket_match_multiplier}x</b>, Rain{' '}
              <b>{parameters.rain_intensity_mm_hr}mm</b>, Riders <b>{parameters.available_riders}</b>
              {parameters.delivery_delay_minutes > 0 && `, Delay +${parameters.delivery_delay_minutes}m`}
              {parameters.transfer_blocked && ', Corridor Blocked'}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-slate-500 text-[11px]">
          Simulated Financial Exposure:{' '}
          <span className="font-bold text-slate-800">
            ₹{simExposure.toLocaleString('en-IN')}
          </span>{' '}
          {exposureDiff !== 0 && (
            <span className={exposureDiff > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
              ({exposureDiff > 0 ? `+₹${exposureDiff.toLocaleString('en-IN')}` : `-₹${Math.abs(exposureDiff).toLocaleString('en-IN')}`})
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
