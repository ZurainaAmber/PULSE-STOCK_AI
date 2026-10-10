import React from 'react'
import {
  Zap,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  Truck,
  Store,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Info,
} from 'lucide-react'
import { Badge } from '../common/Badge'

function getOptionIcon(type) {
  switch (type) {
    case 'TRANSFER':
      return <Store className="w-4 h-4 text-indigo-600" />
    case 'EARLIER_TRUCK':
      return <Truck className="w-4 h-4 text-sky-600" />
    case 'SHELF_SWAP':
      return <Zap className="w-4 h-4 text-purple-600" />
    case 'WAIT':
      return <Clock className="w-4 h-4 text-slate-500" />
    default:
      return <Zap className="w-4 h-4 text-slate-600" />
  }
}

export function SimulatedRecommendationsDeck({
  recommendations = [],
  baselineRecommendations = [],
  source = 'mock',
  isBackendStub = false,
  isMalformed = false,
}) {
  const isLive = source === 'live'
  const hasRecommendations = Array.isArray(recommendations) && recommendations.length > 0

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
      {/* Deck Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-700" />
              Simulated Resolution Strategy Rankings
            </h3>
            <Badge
              variant={
                isLive
                  ? hasRecommendations
                    ? 'success'
                    : isMalformed
                    ? 'critical'
                    : 'warning'
                  : 'neutral'
              }
              size="sm"
            >
              {isLive
                ? hasRecommendations
                  ? 'Live Engine Output'
                  : isMalformed
                  ? 'Malformed Engine Response'
                  : 'Live Output Unavailable'
                : 'Mock Engine Output'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Recalculated resolution rankings based on dynamic rider capacity, road conditions, and surge pace.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <Badge variant="neutral" size="sm">
            Strictly Read-Only Sandbox
          </Badge>
        </div>
      </div>

      {/* Live Mode Empty State: Backend returned no recommendations or malformed */}
      {isLive && !hasRecommendations ? (
        <div
          className={`p-8 rounded-xl text-center space-y-3 ${
            isMalformed
              ? 'bg-rose-50/60 border border-rose-200'
              : 'bg-slate-50 border border-slate-200'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
              isMalformed
                ? 'bg-rose-100 text-rose-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isMalformed ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">
              {isMalformed
                ? 'Malformed Live Engine Response'
                : 'The live simulation engine returned no recommendations. Backend simulation results are currently unavailable.'}
            </h4>
            <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
              {isMalformed
                ? 'The live backend response payload did not contain a valid simulated_recommendations array. Backend simulation results cannot be verified.'
                : 'The live endpoint (POST /api/v1/simulation/recalculate) completed with an empty recommendations array (stub implementation). In accordance with data integrity rules, mock recommendation cards are not rendered in Live mode.'}
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border ${
              isMalformed
                ? 'text-rose-800 bg-rose-50 border-rose-200/80'
                : 'text-amber-800 bg-amber-50 border-amber-200/80'
            }`}
          >
            <ShieldCheck
              className={`w-3.5 h-3.5 ${
                isMalformed ? 'text-rose-600' : 'text-amber-600'
              }`}
            />
            {isMalformed
              ? 'Check backend service logs or contact engineering for POST /api/v1/simulation/recalculate.'
              : 'Switch to Mock mode in Header to explore deterministic resolution rankings.'}
          </div>
        </div>
      ) : (
        /* Recommendations Cards Grid (Rendered for Mock mode or non-empty Live mode) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec, index) => {
          const rank = rec.rank || index + 1
          const isRank1 = rank === 1
          const isPrevented = Boolean(rec.stockout_prevented)
          const baseRec = baselineRecommendations.find((b) => b.option_type === rec.option_type)
          const wasPromoted = baseRec && baseRec.rank > rank
          const wasDemoted = baseRec && baseRec.rank < rank

          return (
            <div
              key={rec.option_type || index}
              className={`p-4 rounded-xl border transition-all ${
                isRank1
                  ? 'bg-teal-50/40 border-teal-300 ring-1 ring-teal-500/15'
                  : 'bg-slate-50/50 border-slate-200/80'
              }`}
            >
              {/* Card Header: Rank, Icon, Title, and Rank Delta */}
              <div className="flex items-start justify-between gap-2">
                 <div className="flex items-center gap-2.5">
                   <div
                     className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                       isRank1
                         ? 'bg-teal-700 text-white shadow-xs'
                         : 'bg-slate-200 text-slate-700'
                     }`}
                   >
                    #{rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-slate-900">
                        {rec.title}
                      </span>
                      {wasPromoted && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          ▲ Promoted
                        </span>
                      )}
                      {wasDemoted && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          ▼ Demoted
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      {rec.option_type}
                    </span>
                  </div>
                </div>

                {/* Prevention Status Badge */}
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 ${
                    isPrevented
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {isPrevented ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Stockout Prevented
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-rose-600" />
                      Stockout Occurs
                    </>
                  )}
                </span>
              </div>

              {/* Summary Text */}
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                {rec.summary}
              </p>

              {/* Parameters Strip */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Arrival ETA</span>
                  <span className="font-semibold text-slate-800">
                    {rec.eta_minutes !== null && rec.eta_minutes !== undefined
                      ? `${rec.eta_minutes} mins`
                      : 'Unavailable'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Cost (INR)</span>
                  <span className="font-semibold text-slate-800">
                    {typeof rec.cost_inr === 'number'
                      ? `₹${rec.cost_inr.toLocaleString('en-IN')}`
                      : '₹0'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px]">Confidence</span>
                  <span className="font-semibold text-slate-800">
                    {typeof rec.confidence_score === 'number'
                      ? `${Math.round(rec.confidence_score * 100)}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {/* Safety & Non-Mutation Disclaimer Footer */}
      <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-slate-600 text-[11px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>
            <b>Operational Safety Notice:</b> Simulation calculations are sandboxed in client memory. No dispatch orders, rider calls, or approvals are executed from this interface.
          </span>
        </div>
      </div>
    </div>
  )
}
