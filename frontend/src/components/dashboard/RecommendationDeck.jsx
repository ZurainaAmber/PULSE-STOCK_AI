import React from 'react'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Building2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  AlertTriangle,
  Edit3
} from 'lucide-react'
import clsx from 'clsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { OPTION_THEME } from '../../constants/theme'
import { OPTION_TYPE } from '../../constants/contracts'

export function RecommendationDeck({
  recommendations = [],
  onApprove,
  onEditQuantityApprove,
  onReject,
  loading = false,
  alertId,
}) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Evaluated Resolution Strategies
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {recommendations.length} Options Evaluated
            </span>
          </div>
          <CardTitle className="text-sm mt-0.5">
            Decision Engine Evaluation Deck
          </CardTitle>
          <CardDescription className="text-[11px]">
            Ranked strategies for alert <span className="font-mono text-slate-700 font-semibold">{alertId}</span> based on arrival ETA, financial impact & stockout prevention.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 space-y-4">
        {loading && (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <div className="w-5 h-5 mx-auto border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            <span>Evaluating resolution options...</span>
          </div>
        )}

        {!loading && recommendations.length === 0 && (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <AlertTriangle className="w-6 h-6 mx-auto text-amber-500 opacity-60" />
            <p className="font-semibold text-slate-600">No recommendations available for this alert</p>
            <p className="text-[11px]">Check if decision engine has evaluated alert {alertId}.</p>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => {
              const optTheme = OPTION_THEME[rec.option_type] || OPTION_THEME[OPTION_TYPE.WAIT]
              const actionParams = rec.action_parameters || {}
              const finImpact = rec.financial_impact || {}
              const tradeoffs = rec.tradeoff_analysis || { pros: [], cons: [] }

              const isApproved = rec._status === 'APPROVED'
              const isRejected = rec._status === 'REJECTED'
              const isRecommended = Boolean(rec.is_recommended)

              const costFormatted = finImpact.execution_cost_inr !== undefined ? `₹${finImpact.execution_cost_inr}` : 'N/A'
              const savedFormatted = finImpact.revenue_saved_inr !== undefined ? `₹${finImpact.revenue_saved_inr}` : 'N/A'
              const netGain = finImpact.net_gain_inr

              return (
                <div
                  key={rec.recommendation_id}
                  className={clsx(
                    'p-4 rounded-xl border transition-all flex flex-col justify-between text-xs space-y-3 relative',
                    isRecommended && !isRejected
                      ? 'border-teal-500 bg-white ring-2 ring-teal-500/20 shadow-sm'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 shadow-2xs',
                    isApproved && 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-500/20',
                    isRejected && 'border-rose-200 bg-rose-50/20 opacity-75'
                  )}
                >
                  {/* Top Header: Rank, Type Badge & Recommendation Tag */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-xs border border-slate-200 shrink-0">
                        #{rec.rank}
                      </span>
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${optTheme.badgeClass}`}>
                          {rec.option_type}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs mt-1 leading-snug">
                          {rec.title}
                        </h4>
                      </div>
                    </div>

                    {isRecommended && !isApproved && !isRejected && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-700 text-white shadow-xs shrink-0 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-300" />
                        TOP AI PICK
                      </span>
                    )}

                    {isApproved && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        APPROVED
                      </span>
                    )}

                    {isRejected && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 shrink-0 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-red-600" />
                        REJECTED
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {rec.summary}
                  </p>

                  {/* Operational Parameters Pill */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Source / Vehicle</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {actionParams.source_id || actionParams.truck_id || actionParams.source_sku_id || 'Scheduled Route'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Arrival ETA / Window</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        {actionParams.eta_minutes ? `${actionParams.eta_minutes} mins` : actionParams.expected_stockout_duration_minutes ? `${actionParams.expected_stockout_duration_minutes}m outage` : 'Immediate'}
                      </span>
                    </div>

                    {actionParams.transfer_quantity_units && (
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 flex justify-between">
                        <span className="text-slate-500">Replenishment Quantity:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {rec._overrideQuantity ? `${rec._overrideQuantity}u (Override)` : `${actionParams.transfer_quantity_units} units`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Financial Impact Comparison */}
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 grid grid-cols-3 gap-1.5 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Cost</span>
                      <span className="font-bold text-slate-700 text-xs">{costFormatted}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Saved</span>
                      <span className="font-bold text-slate-700 text-xs">{savedFormatted}</span>
                    </div>
                    <div className={clsx('p-1 rounded-md', netGain > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                      <span className="text-[9px] block font-bold">Net Impact</span>
                      <span className="font-extrabold text-xs">
                        {netGain !== undefined ? (netGain >= 0 ? `+₹${netGain}` : `-₹${Math.abs(netGain)}`) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Trade-off Analysis: Pros & Cons */}
                  <div className="space-y-1 text-[11px] pt-1">
                    {tradeoffs.pros?.length > 0 && (
                      <div className="space-y-0.5">
                        {tradeoffs.pros.slice(0, 2).map((pro, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-emerald-800 text-[10px]">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{pro}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {tradeoffs.cons?.length > 0 && (
                      <div className="space-y-0.5">
                        {tradeoffs.cons.slice(0, 2).map((con, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-amber-800 text-[10px]">
                            <span className="text-amber-500 font-bold">!</span>
                            <span>{con}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isApproved || isRejected ? (
                      <div className="w-full text-center py-1.5 rounded-lg bg-slate-100 text-slate-600 font-medium text-[11px]">
                        Action recorded {rec._actionId ? `(${rec._actionId})` : ''}
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onReject(rec)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          Reject
                        </Button>

                        <div className="flex items-center gap-1.5">
                          {actionParams.transfer_quantity_units && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onEditQuantityApprove(rec)}
                              title="Edit quantity before approving"
                              className="text-xs"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit Qty
                            </Button>
                          )}

                          <Button
                            variant={isRecommended ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => onApprove(rec)}
                            icon={CheckCircle2}
                            className="text-xs"
                          >
                            Approve
                          </Button>
                        </div>
                      </>
                    )}
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
