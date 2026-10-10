import React from 'react'
import {
  LayoutDashboard,
  Truck,
  Store,
  FileText,
  Sliders,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Clock,
  ArrowLeftRight
} from 'lucide-react'
import clsx from 'clsx'
import { StatusIndicator } from '../common/StatusIndicator'

export const NAVIGATION_ITEMS = [
  {
    id: 'manager',
    label: 'Manager Dashboard',
    description: 'Alert queue, approvals & financial impact',
    icon: LayoutDashboard,
    badge: '1 Critical',
    badgeVariant: 'critical',
  },
  {
    id: 'transfers',
    label: 'Stock Transfers',
    description: 'Peer-to-peer store stock requests & fulfillment',
    icon: ArrowLeftRight,
    badge: 'Live',
    badgeVariant: 'primary',
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Task queue, transfers & rider fleet',
    icon: Truck,
    badge: 'Pending',
    badgeVariant: 'warning',
  },
  {
    id: 'store',
    label: 'Store Details',
    description: 'Inventory breakdown & 24h demand curves',
    icon: Store,
    badge: null,
  },
  {
    id: 'actions',
    label: 'Action Log',
    description: 'Audit trail of approved & rejected actions',
    icon: FileText,
    badge: null,
  },
  {
    id: 'simulation',
    label: 'What-If Simulation',
    description: 'Scenario replanning & multiplier overrides',
    icon: Sliders,
    badge: 'Sandbox',
    badgeVariant: 'primary',
  },
]

export function Sidebar({
  activeTab = 'manager',
  onSelectTab,
  dataSourceMode = 'mock',
  className = '',
  onCloseMobile,
}) {
  return (
    <aside
      className={clsx(
        'w-72 bg-[#04201e] border-r border-[#0b3b38] flex flex-col shrink-0 select-none h-full text-slate-100 shadow-xl',
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-[#0b3b38]/80 flex items-center justify-between bg-[#041a18]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-teal-700 text-[#04201e] flex items-center justify-center font-black text-base shadow-md shadow-emerald-500/20 ring-1 ring-emerald-300/30">
            PS
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-snug flex items-center gap-1.5">
              PulseStock AI
            </h1>
            <p className="text-[11px] font-medium text-teal-300/80">
              Retail Stockout Prevention
            </p>
          </div>
        </div>
      </div>

      {/* Target Focus Store Pill */}
      <div className="p-3.5 mx-3.5 my-3 bg-[#072a27]/90 rounded-xl border border-[#0d4642] shadow-xs">
        <div className="flex items-center justify-between text-[11px] font-medium text-teal-300/80">
          <span className="flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            Active Target Store
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            STORE_007
          </span>
        </div>
        <div className="mt-1 font-semibold text-xs text-white truncate">
          Store 7 - Koramangala
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-teal-200/70 pt-1.5 border-t border-[#0b3b38]/80">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            Attention Window:
          </span>
          <span className="font-bold text-emerald-300">4 Hours</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-300/60">
          Workspace Navigation
        </div>

        {NAVIGATION_ITEMS.map((item) => {
          const isActive = activeTab === item.id
          const Icon = item.icon

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab?.(item.id)
                onCloseMobile?.()
              }}
              className={clsx(
                'w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between transition-all group cursor-pointer',
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 font-semibold border border-emerald-500/30 shadow-xs'
                  : 'text-teal-100/75 hover:text-white hover:bg-white/5 border border-transparent font-medium'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={clsx(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-emerald-400' : 'text-teal-300/60 group-hover:text-teal-200'
                  )}
                />
                <span className="text-xs truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={clsx(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ml-2',
                    item.badgeVariant === 'critical' && 'bg-rose-500/20 text-rose-300 border-rose-500/30',
                    item.badgeVariant === 'warning' && 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                    item.badgeVariant === 'primary' && 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer System Status Panel */}
      <div className="p-4 border-t border-[#0b3b38]/80 bg-[#031715] space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-teal-300/70 font-medium">Data Source Mode:</span>
          <StatusIndicator
            status={dataSourceMode === 'live' ? 'live' : 'mock'}
            label={dataSourceMode === 'live' ? 'Live API (FastAPI)' : 'Mock Mode (Contract)'}
            pulse={true}
            className="text-teal-200"
          />
        </div>

        <div className="p-2.5 rounded-xl bg-[#062421] border border-[#0d4642] text-[11px] text-teal-200/80 space-y-1">
          <div className="flex items-center justify-between font-medium text-white">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Decision Engine
            </span>
            <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
              Active Shell
            </span>
          </div>
          <div className="text-[10px] text-teal-300/60 font-mono">
            Cypher 2026 • Challenge 6
          </div>
        </div>
      </div>
    </aside>
  )
}
