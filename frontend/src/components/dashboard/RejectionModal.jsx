import React, { useState } from 'react'
import {
  XCircle,
  X,
  AlertTriangle,
  AlertCircle
} from 'lucide-react'
import { Button } from '../common/Button'
import { DEFAULT_CONTEXT, REJECTION_REASONS } from '../../constants/contracts'
import { OPTION_THEME } from '../../constants/theme'

export function RejectionModal({
  isOpen,
  onClose,
  recommendation,
  onConfirmReject,
  isSubmitting = false,
  error = null,
}) {
  if (!isOpen || !recommendation) return null

  const optTheme = OPTION_THEME[recommendation.option_type] || OPTION_THEME.TRANSFER

  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0].code)
  const [notes, setNotes] = useState(
    'Rider availability impacted by flood zone or operational priority.'
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedReason) return

    onConfirmReject({
      managerId: DEFAULT_CONTEXT.DEFAULT_MANAGER_ID,
      rejectionReason: selectedReason,
      notes,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-tight">
                Reject Recommendation
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
          {/* Target Recommendation Summary */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">
                {recommendation.title}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${optTheme.badgeClass}`}>
                {recommendation.option_type}
              </span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              {recommendation.summary}
            </p>
          </div>

          {/* Mandatory Rejection Reason Dropdown */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800 text-xs">
              Rejection Reason <span className="text-red-500">* (Mandatory by API Contract)</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800 font-medium"
              required
            >
              {REJECTION_REASONS.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.code} — {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Rejection Notes */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700 text-xs">
              Manager Rejection Notes / Operational Context
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain why this recommendation is being declined..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Provenance */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Submitting as: <strong className="text-slate-700">{DEFAULT_CONTEXT.DEFAULT_MANAGER_ID}</strong></span>
            <span className="text-amber-600 font-medium">Rejection will be recorded in audit log</span>
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
              variant="danger"
              loading={isSubmitting}
              icon={XCircle}
              disabled={!selectedReason}
            >
              Confirm Rejection
            </Button>
          </div>
        </form>

      </div>
    </div>
  )
}
