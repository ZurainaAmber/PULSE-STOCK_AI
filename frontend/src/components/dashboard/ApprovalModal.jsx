import React, { useState } from 'react'
import {
  CheckCircle2,
  X,
  TrendingUp,
  Truck,
  Layers,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { DEFAULT_CONTEXT } from '../../constants/contracts'
import { OPTION_THEME } from '../../constants/theme'

export function ApprovalModal({
  isOpen,
  onClose,
  recommendation,
  onConfirmApprove,
  initialEditQuantity = false,
  isSubmitting = false,
  error = null,
}) {
  if (!isOpen || !recommendation) return null

  const optTheme = OPTION_THEME[recommendation.option_type] || OPTION_THEME.TRANSFER
  const actionParams = recommendation.action_parameters || {}
  const defaultQuantity = actionParams.transfer_quantity_units || 50

  const [enableQuantityOverride, setEnableQuantityOverride] = useState(initialEditQuantity)
  const [overrideQuantity, setOverrideQuantity] = useState(defaultQuantity)
  const [managerNotes, setManagerNotes] = useState(
    recommendation.option_type === 'TRANSFER'
      ? 'Approved express rider transfer from Store 3 due to incoming match crowd.'
      : 'Approved resolution recommendation.'
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirmApprove({
      managerId: DEFAULT_CONTEXT.DEFAULT_MANAGER_ID,
      managerNotes,
      overrideQuantityUnits: enableQuantityOverride ? Number(overrideQuantity) : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Approve Recommendation
              </h3>
              <p className="text-xs text-slate-500">
                #{recommendation.rank} • {recommendation.recommendation_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Recommendation Overview Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">
                {recommendation.title}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${optTheme.badgeClass}`}>
                {recommendation.option_type}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {recommendation.summary}
            </p>

            {/* Financial Summary */}
            <div className="pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Cost (INR)</span>
                <span className="font-bold text-slate-800 text-xs">₹{recommendation.financial_impact?.execution_cost_inr ?? 0}</span>
              </div>
              <div className="p-2 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Revenue Saved</span>
                <span className="font-bold text-slate-800 text-xs">₹{recommendation.financial_impact?.revenue_saved_inr ?? 0}</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] text-emerald-600 block font-bold">Net Financial Gain</span>
                <span className="font-extrabold text-emerald-700 text-xs">+₹{recommendation.financial_impact?.net_gain_inr ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Quantity Override Option (Edit Quantity) */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableQuantityOverride}
                onChange={(e) => setEnableQuantityOverride(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 cursor-pointer"
              />
              <span className="font-semibold text-slate-800 text-xs">
                Override Transfer Quantity before approval
              </span>
            </label>

            {enableQuantityOverride && (
              <div className="pl-6 space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={overrideQuantity}
                    onChange={(e) => setOverrideQuantity(e.target.value)}
                    className="w-28 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono font-bold"
                  />
                  <span className="text-slate-500 text-xs">units (physical stock allocation)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Standard recommendation is {defaultQuantity} units. Custom quantity will be passed in the approval request payload.
                </p>
              </div>
            )}
          </div>

          {/* Manager Notes */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700 text-xs">
              Manager Approval Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={managerNotes}
              onChange={(e) => setManagerNotes(e.target.value)}
              placeholder="Add internal notes regarding this approval decision..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Manager Identity Provenance */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Submitting as: <strong className="text-slate-700">{DEFAULT_CONTEXT.DEFAULT_MANAGER_ID}</strong></span>
            <span>Target: Store 7 Koramangala</span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error.message || String(error)}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              icon={CheckCircle2}
            >
              Confirm Approval
            </Button>
          </div>
        </form>

      </div>
    </div>
  )
}
