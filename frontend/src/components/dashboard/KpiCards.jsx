import React from 'react'
import {
  AlertTriangle,
  ShieldCheck,
  TrendingDown,
  Bike,
  Building2,
  Clock,
  HelpCircle
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '../common/Card'

export function KpiCards({
  // 1. Revenue & Margin Loss
  revenueAtRisk = null,
  profitMarginAtRisk = null,
  revenueSubtitle = null,
  criticalAlertsCount = 0,

  // 2. Protected Value
  protectedValue = null,
  netGainPercentage = null,
  protectedSubtitle = null,

  // 3. Expected Stockouts
  expectedStockouts = null,
  stockoutSubtitle = null,

  // 4. Rider Fleet
  riderShortages = null,
  riderSurge = null,
  riderSubtitle = null,

  // 5. Network Scope
  networkHealthData = null,
  networkSubtitle = null,

  dataSourceMode = 'mock',
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      
      {/* 1. Revenue Loss Exposure (Gross & Margin) */}
      <Card hover={true} className="border-rose-100 ring-1 ring-rose-500/10 bg-white">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Revenue at Risk (Gross)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 text-2xl font-extrabold text-rose-600 tracking-tight">
            {revenueAtRisk !== null && revenueAtRisk !== undefined ? (
              `₹${revenueAtRisk.toLocaleString('en-IN')}`
            ) : (
              <span className="text-slate-400 text-lg font-medium">Unavailable</span>
            )}
          </div>

          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] border border-rose-200">
                {criticalAlertsCount} Critical
              </span>
              <span className="truncate">{revenueSubtitle || 'Exposure window'}</span>
            </div>

            {profitMarginAtRisk !== null && profitMarginAtRisk !== undefined && (
              <div className="text-[10px] text-slate-400 font-mono">
                Est. Profit Margin Loss: ₹{profitMarginAtRisk.toLocaleString('en-IN')}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* 2. Protected Value */}
      <Card hover={true} className="border-emerald-100 ring-1 ring-emerald-500/10 bg-white">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Protected Value</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 text-2xl font-extrabold text-emerald-600 tracking-tight">
            {protectedValue !== null && protectedValue !== undefined ? (
              `₹${protectedValue.toLocaleString('en-IN')}`
            ) : (
              <span className="text-slate-400 text-lg font-medium">Unavailable</span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            {netGainPercentage !== null && !isNaN(netGainPercentage) ? (
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200 shrink-0">
                {netGainPercentage}% Protected
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                Ratio Pending
              </span>
            )}
            <span className="truncate">{protectedSubtitle || 'If top strategy approved'}</span>
          </div>
        </CardHeader>
      </Card>

      {/* 3. Expected Stock-outs */}
      <Card hover={true} className="border-amber-100 ring-1 ring-amber-500/10 bg-white">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Expected Stockouts</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 text-2xl font-extrabold text-amber-600 tracking-tight">
            {expectedStockouts !== null && expectedStockouts !== undefined ? (
              <>
                {expectedStockouts} <span className="text-sm font-semibold text-slate-400">SKU</span>
              </>
            ) : (
              <span className="text-slate-400 text-lg font-medium">Unavailable</span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border border-amber-200 shrink-0">
              {criticalAlertsCount > 0 ? 'Urgent Risk' : 'Monitoring'}
            </span>
            <span className="truncate">{stockoutSubtitle || 'Active dark store'}</span>
          </div>
        </CardHeader>
      </Card>

      {/* 4. Rider Deficit */}
      <Card hover={true} className="border-slate-200/80 bg-white">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Rider Deficit</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
              <Bike className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {riderShortages !== null && riderShortages !== undefined ? (
              riderShortages > 0 ? (
                <>
                  {riderShortages} <span className="text-xs font-semibold text-rose-600 font-mono">short</span>
                </>
              ) : (
                <span className="text-emerald-600 text-xl font-bold">0 (Normal)</span>
              )
            ) : (
              <span className="text-slate-400 text-lg font-medium">Unavailable</span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            {riderSurge !== null && riderShortages > 0 ? (
              <span className="font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded text-[10px] border border-teal-200 shrink-0">
                {riderSurge}x Surge
              </span>
            ) : (
              <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200 shrink-0">
                Fleet Fleet
              </span>
            )}
            <span className="truncate">{riderSubtitle || 'Hyper-local fleet'}</span>
          </div>
        </CardHeader>
      </Card>

      {/* 5. Network Scope */}
      <Card hover={true} className="border-slate-200/80 bg-white">
        <CardHeader className="p-4 pb-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Network Health</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-2 text-2xl font-extrabold text-slate-900 tracking-tight">
            {networkHealthData ? (
              dataSourceMode === 'mock' && networkHealthData.totalStores ? (
                <>
                  {networkHealthData.stableStores}{' '}
                  <span className="text-xs font-normal text-slate-400">/ {networkHealthData.totalStores} Stores</span>
                </>
              ) : (
                <>
                  {networkHealthData.atRiskCount}{' '}
                  <span className="text-xs font-normal text-slate-400">Stores at Risk</span>
                </>
              )
            ) : (
              <span className="text-slate-400 text-lg font-medium">Scoped View</span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200 shrink-0">
              {dataSourceMode === 'mock' ? 'Mock Master' : 'Live Endpoint'}
            </span>
            <span className="truncate">{networkSubtitle || 'Store network status'}</span>
          </div>
        </CardHeader>
      </Card>

    </div>
  )
}
