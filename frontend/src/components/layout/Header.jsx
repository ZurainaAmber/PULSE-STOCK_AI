import React, { useState } from 'react'
import {
  Menu,
  Bell,
  Search,
  Store,
  ChevronDown,
  User,
  ShieldAlert,
  Database,
  RefreshCw
} from 'lucide-react'
import clsx from 'clsx'
import { Badge } from '../common/Badge'
import { StatusIndicator } from '../common/StatusIndicator'

const AVAILABLE_STORES = [
  { id: 'STORE_007', name: 'Store 7 - Koramangala Tech Park', alertCount: 1 },
  { id: 'STORE_003', name: 'Store 3 - Indiranagar', alertCount: 1 },
  { id: 'STORE_012', name: 'Store 12 - HSR Layout', alertCount: 1 },
]

export function Header({
  activeTabTitle = 'Manager Dashboard',
  activeTabDescription = 'Stock-out alerts & recommendation approval engine',
  selectedStoreId = 'STORE_007',
  onSelectStore,
  dataSourceMode = 'mock',
  onToggleDataSourceMode,
  onOpenMobileMenu,
  alertCount = 1,
  currentUser = null,
  incomingTransfersCount = 0,
  onOpenTransfers = null,
  onLogout = null,
  onSwitchManager = null,
}) {
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const currentStore = AVAILABLE_STORES.find((s) => s.id === selectedStoreId) || AVAILABLE_STORES[0]

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 select-none sticky top-0 z-20">
      {/* Left Section: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {activeTabTitle}
            </h2>
            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
              Enterprise Dashboard
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            {activeTabDescription}
          </p>
        </div>
      </div>

      {/* Right Section: Store Selector, Source Mode Badge, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Store Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setStoreDropdownOpen(!storeDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-slate-50 text-xs font-medium text-slate-800 transition-all hover:bg-teal-50/30 cursor-pointer"
          >
            <Store className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="font-semibold hidden md:inline">{currentStore.id}:</span>
            <span className="truncate max-w-[100px] sm:max-w-[120px] md:max-w-[160px]">{currentStore.name.split(' - ')[1] || currentStore.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {storeDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Select Active Dark Store
              </div>
              {AVAILABLE_STORES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onSelectStore?.(s.id)
                    setStoreDropdownOpen(false)
                  }}
                  className={clsx(
                    'w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer',
                    s.id === selectedStoreId && 'bg-teal-50 font-semibold text-teal-900'
                  )}
                >
                  <div className="truncate">
                    <span className="font-mono text-[11px] mr-1.5 text-slate-500">{s.id}</span>
                    <span>{s.name}</span>
                  </div>
                  {s.alertCount > 0 && (
                    <span className="ml-2 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                      {s.alertCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Explicit Data Source Mode Toggle Badge */}
        <div className="flex items-center">
          <button
            onClick={onToggleDataSourceMode}
            title="Click to toggle Data Source Mode (Mock vs Live API)"
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer',
              dataSourceMode === 'live'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
            )}
          >
            <Database className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">Mode: </span>
            <span>{dataSourceMode.toUpperCase()}</span>
            <RefreshCw className="w-2.5 h-2.5 opacity-60 ml-0.5" />
          </button>
        </div>

        {/* Incoming Transfers Notification Pill */}
        {incomingTransfersCount > 0 && (
          <button
            onClick={onOpenTransfers}
            title="Incoming stock requests pending your decision"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-all cursor-pointer animate-pulse"
          >
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span>{incomingTransfersCount} Req Pending</span>
          </button>
        )}

        {/* Notifications Icon with Critical Alert Badge */}
        <div className="relative">
          <button
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors relative cursor-pointer"
            aria-label="Stockout alerts"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {alertCount}
              </span>
            )}
          </button>
        </div>

        {/* Manager User Pill & Dropdown */}
        <div className="relative pl-2 border-l border-slate-200">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentUser?.store_id ? currentUser.store_id.replace('STORE_', 'M') : 'M7'}
            </div>
            <div className="hidden lg:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser?.manager_name || 'Koramangala Mgr'}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {currentUser?.username || 'MGR_KORAMANGALA_07'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Current Session
              </div>
              <div className="px-3 py-2 text-xs">
                <div className="font-bold text-slate-800">{currentUser?.manager_name}</div>
                <div className="text-[11px] text-teal-700 font-mono">{currentUser?.store_id} ({currentUser?.store_name})</div>
              </div>

              <div className="border-t border-slate-100 pt-1">
                {onSwitchManager && (
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false)
                      onSwitchManager()
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    Switch Demo Manager...
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false)
                      onLogout()
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 font-semibold cursor-pointer"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
