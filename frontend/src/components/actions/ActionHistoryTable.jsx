import React from 'react'
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Building2,
  Package,
  User,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { resolveStoreName, resolveSkuName } from '../../services/actionsService'

function formatTimestamp(isoString) {
  if (!isoString) return 'Unavailable'
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    }).format(date) + ' UTC'
  } catch {
    return isoString
  }
}

function getRelativeTime(isoString) {
  if (!isoString) return ''
  try {
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffMins = Math.round(diffMs / 60000)
    if (diffMins < 0) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.round(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.round(diffHours / 24)
    return `${diffDays}d ago`
  } catch {
    return ''
  }
}

function getActionTypeBadge(type) {
  switch (type) {
    case 'TRANSFER':
      return {
        label: 'Inter-Store Transfer',
        color: 'bg-teal-50 text-teal-800 border-teal-200',
      }
    case 'EARLIER_TRUCK':
      return {
        label: 'Expedited Truck',
        color: 'bg-sky-50 text-sky-800 border-sky-200',
      }
    case 'SHELF_SWAP':
      return {
        label: 'Shelf Space Swap',
        color: 'bg-purple-50 text-purple-800 border-purple-200',
      }
    case 'WAIT':
      return {
        label: 'Scheduled Batch Wait',
        color: 'bg-slate-50 text-slate-700 border-slate-200',
      }
    default:
      return {
        label: type || 'Action',
        color: 'bg-slate-50 text-slate-700 border-slate-200',
      }
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'APPROVED':
      return {
        label: 'Approved (Decision Logged)',
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
        icon: <Clock className="w-3 h-3 text-sky-600 inline mr-1" />,
        tooltip: 'Manager authorized action. Physical fulfillment tracked separately.',
      }
    case 'EXECUTED':
      return {
        label: 'Executed (Fulfillment Confirmed)',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 inline mr-1" />,
        tooltip: 'Action confirmed received and physically stocked.',
      }
    case 'REJECTED':
      return {
        label: 'Rejected',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        icon: <XCircle className="w-3 h-3 text-rose-600 inline mr-1" />,
        tooltip: 'Recommendation declined by manager. No operational dispatch.',
      }
    default:
      return {
        label: status || 'Pending',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
        icon: null,
        tooltip: 'Pending audit confirmation.',
      }
  }
}

export function ActionHistoryTable({
  actions = [],
  onSelectAction,
  onResetFilters,
}) {
  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">No Action Records Found</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          No historical manager approvals, rejections, or executed actions match your current search and filter criteria.
        </p>
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="text-xs text-teal-700 border-teal-200 hover:bg-teal-50"
          >
            Clear Filters & View All
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Desktop Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="bg-[#f8faf9] border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Action ID & Type</th>
              <th className="py-3 px-4">Audit Status</th>
              <th className="py-3 px-4">Store & Product</th>
              <th className="py-3 px-4">Actor & Notes</th>
              <th className="py-3 px-4">Financial Record</th>
              <th className="py-3 px-4">Timestamp (UTC)</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {actions.map((item) => {
              const typeBadge = getActionTypeBadge(item.action_type)
              const statusBadge = getStatusBadge(item.status)
              const storeName = resolveStoreName(item.store_id)
              const skuName = resolveSkuName(item.sku_id)
              const relTime = getRelativeTime(item.created_at)

              return (
                <tr
                  key={item.action_id}
                  onClick={() => onSelectAction(item)}
                  className="hover:bg-teal-50/25 transition-colors cursor-pointer group"
                >
                  {/* Action ID & Type */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-mono text-xs font-semibold text-slate-900 group-hover:text-teal-700 transition-colors break-all">
                      {item.action_id}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${typeBadge.color}`}
                      >
                        {typeBadge.label}
                      </span>
                    </div>
                    {item.alert_id && (
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        Ref: {item.alert_id}
                      </div>
                    )}
                  </td>

                  {/* Audit Status */}
                  <td className="py-3.5 px-4 align-top">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold border ${statusBadge.badgeClass}`}
                      title={statusBadge.tooltip}
                    >
                      {statusBadge.icon}
                      {statusBadge.label}
                    </span>
                    {item.status === 'APPROVED' && (
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Decision logged; delivery pending</span>
                      </div>
                    )}
                  </td>

                  {/* Store & Product */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-medium text-slate-900 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{storeName}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                      <Package className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{skuName}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {item.store_id} • {item.sku_id}
                    </div>
                  </td>

                  {/* Actor & Notes */}
                  <td className="py-3.5 px-4 align-top max-w-[220px]">
                    <div className="text-slate-700 font-medium flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px]">{item.manager_id || 'UNASSIGNED'}</span>
                    </div>
                    {item.notes ? (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed italic">
                        "{item.notes}"
                      </p>
                    ) : item.rejection_reason ? (
                      <p className="text-[11px] text-rose-600 mt-1 line-clamp-1">
                        Reason: {item.rejection_reason}
                      </p>
                    ) : (
                      <span className="text-[11px] text-slate-400 mt-1 block">No notes entered</span>
                    )}
                  </td>

                  {/* Financial Record */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="text-[11px] text-slate-700">
                      <span className="text-slate-400">Cost: </span>
                      <span className="font-semibold text-slate-800">
                        {typeof item.cost_inr === 'number' ? `₹${item.cost_inr.toLocaleString('en-IN')}` : '₹0'}
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5">
                      <span className="text-slate-400">Saved: </span>
                      {typeof item.revenue_saved_inr === 'number' ? (
                        <span className="font-semibold text-emerald-600">
                          ₹{item.revenue_saved_inr.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Unavailable</span>
                      )}
                    </div>
                  </td>

                  {/* Timestamp */}
                  <td className="py-3.5 px-4 align-top">
                    <div className="text-slate-700 text-[11px] font-medium">
                      {formatTimestamp(item.created_at)}
                    </div>
                    {relTime && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {relTime}
                      </div>
                    )}
                  </td>

                  {/* Details / Action */}
                  <td className="py-3.5 px-4 align-top text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectAction(item)
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                      title="Inspect Action Audit Record"
                      aria-label={`Inspect action ${item.action_id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
