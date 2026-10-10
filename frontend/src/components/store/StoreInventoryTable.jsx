import React from 'react'
import {
  Boxes,
  Package,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  TrendingDown,
  Info,
  DollarSign
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { Badge } from '../common/Badge'

export function StoreInventoryTable({
  inventory = null,
  alerts = [],
  selectedSkuId = null,
  onSelectSku,
  storeId = 'STORE_007',
}) {
  const skus = inventory?.skus || []

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Physical Inventory & SKU Stock Ledger
                <Badge variant="neutral" className="text-[10px]">
                  {skus.length} {skus.length === 1 ? 'SKU' : 'SKUs'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Front picking shelf vs backroom physical stock breakdown with safety buffers and pricing.
              </CardDescription>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
            Click SKU to focus forecast & logistics
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        {skus.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            {inventory === null ? 'Store inventory data unavailable for this store.' : 'No SKU inventory found.'}
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse select-none">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f8faf9] text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                <th className="py-3 px-4">SKU Product</th>
                <th className="py-3 px-3">Front Shelf</th>
                <th className="py-3 px-3">Backroom</th>
                <th className="py-3 px-3">Total Physical</th>
                <th className="py-3 px-3">Safety / Reorder</th>
                <th className="py-3 px-3">Unit Pricing</th>
                <th className="py-3 px-4">Stockout Status</th>
                <th className="py-3 px-4 text-right">Replenishment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {skus.map((sku) => {
                const shelf = sku.shelf_stock_units ?? 0
                const backroom = sku.backroom_stock_units ?? 0
                const total = sku.total_stock_units ?? (shelf + backroom)
                const capacity = sku.shelf_capacity_units ?? 40
                const safety = sku.safety_stock_threshold_units ?? 25
                const reorder = sku.reorder_point_units ?? 50
                const fillPercent = Math.min(100, Math.round((shelf / (capacity || 1)) * 100))

                // Ghost Stockout: Shelf 0, but Backroom has units
                const isGhostStockout = shelf === 0 && backroom > 0
                const isSelected = selectedSkuId === sku.sku_id

                // Clamped Replenishment quantity
                const spaceAvailable = Math.max(0, capacity - shelf)
                const replenishmentRecommended = Math.min(spaceAvailable, backroom)

                // Match with active stockout alert if present
                const alertMatch = alerts.find((a) => a.sku_id === sku.sku_id)

                return (
                  <tr
                    key={sku.sku_id}
                    onClick={() => onSelectSku && onSelectSku(sku.sku_id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50/70 ring-1 ring-teal-500/30'
                        : isGhostStockout
                        ? 'bg-rose-50/40 hover:bg-rose-50/70'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* 1. Product Name & Category */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {sku.sku_name || sku.sku_id}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] text-teal-800 bg-teal-100 font-semibold px-1.5 py-0.2 rounded border border-teal-200">
                              Focused
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{sku.sku_id}</span>
                          <span>•</span>
                          <span className="text-slate-500 font-sans">{sku.category || 'General'}</span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Front Shelf & Capacity Gauge */}
                    <td className="py-3.5 px-3 min-w-[120px]">
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-bold text-slate-900">
                            {shelf} <span className="text-[10px] font-normal text-slate-400">/ {capacity}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{fillPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              shelf === 0
                                ? 'bg-rose-600'
                                : fillPercent < 30
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 3. Backroom Stock */}
                    <td className="py-3.5 px-3">
                      {sku.backroom_stock_unknown ? (
                        <div>
                          <div className="font-medium text-slate-500 text-xs italic">
                            Uncatalogued
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Not in source CSV
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {backroom} <span className="text-[10px] font-normal text-slate-400">Units</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {backroom > 0 ? `${backroom} available` : 'Depleted'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 4. Total Physical Stock */}
                    <td className="py-3.5 px-3">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {total} <span className="text-[10px] font-normal text-slate-400">Units</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {sku.backroom_stock_unknown ? 'Shelf stock only' : 'Physical total'}
                      </span>
                    </td>

                    {/* 5. Safety Buffer & Reorder Point */}
                    <td className="py-3.5 px-3">
                      <div className="text-slate-700 text-[11px] font-mono">
                        Safety: <span className="font-semibold text-slate-900">{safety}</span>
                      </div>
                      <div className="text-slate-500 text-[10px] font-mono">
                        Reorder: {reorder}
                      </div>
                    </td>

                    {/* 6. Pricing (Selling vs Cost Price) */}
                    <td className="py-3.5 px-3">
                      {sku.unit_selling_price_inr ? (
                        <div>
                          <div className="font-semibold text-slate-900 text-[11px]">
                            ₹{sku.unit_selling_price_inr.toFixed(2)}
                          </div>
                          {sku.unit_cost_price_inr && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Cost: ₹{sku.unit_cost_price_inr.toFixed(2)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Unavailable</span>
                      )}
                    </td>

                    {/* 7. Stockout Status & Alert Match */}
                    <td className="py-3.5 px-4">
                      {isGhostStockout ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
                          <AlertOctagon className="w-3 h-3 text-rose-600" />
                          Ghost Out-of-Stock
                        </span>
                      ) : alertMatch ? (
                        <div className="space-y-0.5">
                          <Badge
                            variant={alertMatch.severity === 'CRITICAL' ? 'danger' : 'warning'}
                            dot={true}
                            className="text-[10px]"
                          >
                            {alertMatch.severity} ({alertMatch.minutes_until_stockout}m)
                          </Badge>
                        </div>
                      ) : shelf <= safety ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Low Safety Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Optimal Stock
                        </span>
                      )}
                    </td>

                    {/* 8. Replenishment Action */}
                    <td className="py-3.5 px-4 text-right">
                      {replenishmentRecommended > 0 ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[11px] inline-block">
                            Move {replenishmentRecommended} Units
                          </span>
                          <span className="text-[9px] text-slate-400 block">
                            Backroom ➔ Shelf
                          </span>
                        </div>
                      ) : spaceAvailable === 0 ? (
                        <span className="text-emerald-600 font-medium text-[11px]">
                          Shelf Full
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium text-[11px]">
                          {sku.backroom_stock_unknown ? `Deficit: ${spaceAvailable} Units` : '0 in Backroom'}
                        </span>
                      )}
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
