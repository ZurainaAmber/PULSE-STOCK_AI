import React from 'react'
import {
  Package,
  Boxes,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  ShieldCheck,
  TrendingUp
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { Badge } from '../common/Badge'

export function ShelfInventoryView({
  inventory = null,
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
                Shelf vs. Backroom Inventory
                <Badge variant="neutral" className="text-[10px]">
                  {skus.length} {skus.length === 1 ? 'SKU' : 'SKUs'} Tracked
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time physical inventory split between front picking shelves and backroom stock.
              </CardDescription>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
            {inventory?.store_name || `Dark Store ${storeId}`}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {skus.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            {inventory === null ? 'Store inventory data unavailable.' : 'No SKU inventory found for this store.'}
          </div>
        ) : (
          <div className="space-y-4">
            {skus.map((sku) => {
              const shelfStock = sku.shelf_stock_units ?? 0
              const shelfCapacity = sku.shelf_capacity_units ?? 40
              const backroomStock = sku.backroom_stock_units ?? 0
              const totalStock = sku.total_stock_units ?? (shelfStock + backroomStock)
              const safetyStock = sku.safety_stock_threshold_units ?? 25
              const reorderPoint = sku.reorder_point_units ?? 50

              // Capacity calculations
              const shelfFillPercent = Math.min(100, Math.round((shelfStock / (shelfCapacity || 1)) * 100))
              const shelfSpaceAvailable = Math.max(0, shelfCapacity - shelfStock)

              // Recommended Replenishment strictly bounded by available backroom stock and shelf capacity
              const recommendedReplenishment = Math.min(shelfSpaceAvailable, backroomStock)

              // Ghost Stockout Detection: Shelf is 0, but inventory exists in the backroom
              const isGhostStockout = shelfStock === 0 && backroomStock > 0

              return (
                <div
                  key={sku.sku_id}
                  className={`p-4 rounded-xl border transition-all ${
                    isGhostStockout
                      ? 'bg-red-50/50 border-red-300 ring-1 ring-red-400/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Ghost Stockout Critical Alert Banner */}
                  {isGhostStockout && (
                    <div className="mb-3 p-3 rounded-lg bg-rose-100/80 border border-rose-200 text-rose-900 text-xs flex items-center gap-2.5 font-medium">
                      <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                      <div>
                        <strong>Critical Blockage: Ghost Out-of-Stock Detected!</strong> Front shelf is at 0 units, but {backroomStock} units are sitting unreplenished in the backroom. Move {recommendedReplenishment} units to the front shelf immediately.
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">
                          {sku.sku_name || sku.sku_id}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          {sku.sku_id}
                        </span>
                        {sku.shelf_slot && (
                          <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded font-mono font-medium border border-teal-200">
                            Slot: {sku.shelf_slot}
                          </span>
                        )}
                        <Badge
                          variant={
                            isGhostStockout
                              ? 'danger'
                              : shelfStock <= 10
                              ? 'warning'
                              : 'success'
                          }
                          dot={true}
                          className="text-[10px]"
                        >
                          {isGhostStockout
                            ? 'Ghost Out-of-Stock'
                            : shelfStock <= 10
                            ? 'Low Shelf Stock'
                            : 'Shelf Stocked'}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500">
                        Category: {sku.category || 'General Cargo'} • Safety Threshold: {safetyStock} Units • Reorder Trigger: {reorderPoint} Units
                      </span>
                    </div>

                    {/* Replenishment Guidance */}
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-slate-900 flex items-center sm:justify-end gap-1">
                        <span>Restock Action:</span>
                        {recommendedReplenishment > 0 ? (
                          <span className="text-teal-700 font-bold">
                            Move {recommendedReplenishment} Units
                          </span>
                        ) : shelfSpaceAvailable === 0 ? (
                          <span className="text-emerald-600 font-bold">
                            Shelf Full (0 Needed)
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold">
                            Backroom Depleted
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Bounded by max shelf capacity ({shelfCapacity}) & backroom stock ({backroomStock})
                      </span>
                    </div>
                  </div>

                  {/* Stock Metrics & Visual Capacity Bars */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Front Shelf Capacity */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Front Shelf Stock</span>
                        <span className="font-bold text-slate-900">
                          {shelfStock} / {shelfCapacity} <span className="text-[10px] font-normal text-slate-400">({shelfFillPercent}%)</span>
                        </span>
                      </div>

                      {/* Visual Fill Gauge */}
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-300 ${
                            shelfFillPercent < 25
                              ? 'bg-rose-500'
                              : shelfFillPercent < 50
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${shelfFillPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span>Space Open: {shelfSpaceAvailable} Units</span>
                        <span>Capacity: {shelfCapacity} Max</span>
                      </div>
                    </div>

                    {/* Backroom Inventory */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Backroom Inventory</span>
                        <span className="font-bold text-slate-900">
                          {backroomStock} <span className="text-[10px] font-normal text-slate-400">Units</span>
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-600 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (backroomStock / (reorderPoint || 1)) * 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span>Transferable: {recommendedReplenishment} Units</span>
                        <span>Holding Buffer: {backroomStock - recommendedReplenishment} Units</span>
                      </div>
                    </div>

                    {/* Total Physical Stock & Reorder Status */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Total Physical Stock</span>
                        <span className="font-bold text-slate-900">
                          {totalStock} <span className="text-[10px] font-normal text-slate-400">Units</span>
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            totalStock <= safetyStock
                              ? 'bg-rose-500'
                              : totalStock <= reorderPoint
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (totalStock / ((reorderPoint * 1.5) || 1)) * 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span>Safety Stock: {safetyStock}</span>
                        <span>Reorder Trigger: {reorderPoint}</span>
                      </div>
                    </div>

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
