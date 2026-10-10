import React, { useEffect, useState } from 'react'
import {
  X,
  FileText,
  Copy,
  Check,
  Building2,
  Package,
  User,
  Clock,
  DollarSign,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Code,
  ShieldAlert,
} from 'lucide-react'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { resolveStoreName, resolveSkuName } from '../../services/actionsService'

export function ActionDetailModal({ action, isOpen, onClose }) {
  const [copiedId, setCopiedId] = useState(false)
  const [showRawJson, setShowRawJson] = useState(false)

  // Handle keyboard ESC
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !action) return null

  const handleCopyId = () => {
    if (action.action_id) {
      navigator.clipboard.writeText(action.action_id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  const storeName = resolveStoreName(action.store_id)
  const skuName = resolveSkuName(action.sku_id)

  const isLive = action._source === 'live'
  const hasCost = typeof action.cost_inr === 'number'
  const hasRevenueSaved = typeof action.revenue_saved_inr === 'number'
  const netGain = hasRevenueSaved && hasCost ? action.revenue_saved_inr - action.cost_inr : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-detail-title"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="action-detail-title" className="text-sm font-bold text-slate-900">
                  Action Audit Record
                </h3>
                <Badge variant={isLive ? 'success' : 'neutral'} size="sm">
                  {isLive ? 'Live Source' : 'Mock Fixture'}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500">
                Authoritative record from GET /api/v1/actions/history
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Action ID Bar */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Action Identifier
              </span>
              <span className="font-mono text-sm font-semibold text-slate-900 break-all">
                {action.action_id}
              </span>
            </div>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer self-start sm:self-auto"
            >
              {copiedId ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>

          {/* Section 1: Associated Entities */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Entity Context & Linkage
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  Target Store
                </span>
                <div className="font-semibold text-slate-800">{storeName}</div>
                <div className="font-mono text-[10px] text-slate-500">{action.store_id}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Package className="w-3 h-3 text-slate-400" />
                  Target Product / SKU
                </span>
                <div className="font-semibold text-slate-800">{skuName}</div>
                <div className="font-mono text-[10px] text-slate-500">{action.sku_id}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400">Related Stockout Alert</span>
                <div className="font-mono font-medium text-slate-800">
                  {action.alert_id || 'Not linked to specific alert'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400">Evaluated Recommendation</span>
                <div className="font-mono font-medium text-slate-800">
                  {action.recommendation_id || 'Direct manual intervention'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Decision Governance & Execution */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Governance & Execution Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  Authorizing Manager / Actor
                </span>
                <div className="font-mono font-semibold text-slate-800">
                  {action.manager_id || 'UNASSIGNED'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Recorded Timestamp
                </span>
                <div className="font-medium text-slate-800">
                  {action.created_at ? new Date(action.created_at).toUTCString() : 'Unavailable'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {action.created_at || 'ISO timestamp missing'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400">Action Type</span>
                <div className="font-semibold text-slate-800">{action.action_type}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400">Recorded Status</span>
                <div className="font-semibold text-slate-800">{action.status}</div>
              </div>
            </div>

            {/* Operational Outcome Disclaimer */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-xs">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Operational Status Interpretation Rule
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                {action.status === 'APPROVED' &&
                  'Status APPROVED represents authorization by store management. Per contract rules, this does not confirm physical receipt or completion of rider transit. Physical delivery is confirmed only when status reaches EXECUTED.'}
                {action.status === 'EXECUTED' &&
                  'Status EXECUTED confirms that the physical replenishment (rider transfer or truck dispatch) has been completed and verified.'}
                {action.status === 'REJECTED' &&
                  'Status REJECTED indicates that the recommendation was declined. No operational transfer, rider assignment, or truck expedite was executed.'}
              </p>
            </div>
          </div>

          {/* Section 3: Notes & Rejection Context */}
          {(action.notes || action.rejection_reason) && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Manager Notes & Rejection Context
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                {action.rejection_reason && (
                  <div>
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                      Rejection Reason Code
                    </span>
                    <span className="font-mono text-xs font-semibold text-rose-700">
                      {action.rejection_reason}
                    </span>
                  </div>
                )}
                {action.notes && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Recorded Decision Notes
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      "{action.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Financial Audit */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Financial Impact Ledger
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-500">Execution Cost</span>
                <div className="font-bold text-sm text-slate-900">
                  {hasCost ? `₹${action.cost_inr.toLocaleString('en-IN')}` : '₹0.00'}
                </div>
                <div className="text-[10px] text-slate-400">Documented freight / fee</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-500">Protected Revenue</span>
                <div className="font-bold text-sm text-slate-900">
                  {hasRevenueSaved ? (
                    `₹${action.revenue_saved_inr.toLocaleString('en-IN')}`
                  ) : (
                    <span className="text-slate-400 text-xs font-normal">
                      Unavailable
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  {hasRevenueSaved
                    ? 'Saved revenue projection'
                    : 'Not recorded in backend DB'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50/50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] text-slate-500">Net Financial Impact</span>
                <div className="font-bold text-sm text-slate-900">
                  {netGain !== null ? (
                    <span className={netGain >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {netGain >= 0 ? '+' : ''}₹{netGain.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs font-normal">
                      Unavailable
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400">
                  {netGain !== null ? 'Protected revenue minus cost' : 'Requires saved revenue'}
                </div>
              </div>
            </div>

            {!hasRevenueSaved && (
              <div className="text-[10px] text-slate-400 italic">
                * Note: Live ActionLog schema does not store revenue_saved_inr. Displayed honestly as Unavailable.
              </div>
            )}
          </div>

          {/* Section 5: Raw JSON Inspector */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              {showRawJson ? 'Hide Raw Audit Record' : 'Inspect Raw JSON Payload'}
            </button>
            {showRawJson && (
              <pre className="p-3 rounded-xl bg-slate-900 text-slate-200 text-[10px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                {JSON.stringify(action, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Modal Footer: Strictly Read-Only */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            Audit ledger is strictly read-only.
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  )
}
