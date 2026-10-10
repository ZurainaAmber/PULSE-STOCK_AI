import React, { useState, useEffect, useCallback } from 'react'
import {
  RotateCcw,
  AlertCircle,
  Truck,
  Bike,
  Boxes,
  Layers,
  Database,
  Building2,
  CheckCircle2
} from 'lucide-react'
import { fetchOperationsData, deriveOperationalTasks } from '../../services/operationsService'
import { getDataSourceMode } from '../../api/client'
import { OperationsKpiSummary } from './OperationsKpiSummary'
import { OperationsTaskBoard } from './OperationsTaskBoard'
import { TransferTracker } from './TransferTracker'
import { ShelfInventoryView } from './ShelfInventoryView'
import { RiderCapacityCard } from './RiderCapacityCard'
import { OperationalBlockages } from './OperationalBlockages'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'

export function OperationsDashboard({ selectedStoreId = 'STORE_007' }) {
  const [operationsData, setOperationsData] = useState(null)
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const dataSourceMode = getDataSourceMode()

  const loadOperations = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchOperationsData(selectedStoreId)
      setOperationsData(data)
      const derivedTasks = deriveOperationalTasks(data)
      setTasks(derivedTasks)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[OperationsDashboard] Error loading data:', err)
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedStoreId, dataSourceMode])

  useEffect(() => {
    loadOperations()
  }, [loadOperations])

  // Compute summary KPI figures
  const skus = operationsData?.inventory?.skus || []
  let totalShelf = 0
  let totalCapacity = 0
  let hasGhostStockout = false

  skus.forEach((s) => {
    totalShelf += s.shelf_stock_units ?? 0
    totalCapacity += s.shelf_capacity_units ?? 40
    if ((s.shelf_stock_units ?? 0) === 0 && (s.backroom_stock_units ?? 0) > 0) {
      hasGhostStockout = true
    }
  })

  const avgShelfFill = totalCapacity > 0 ? Math.round((totalShelf / totalCapacity) * 100) : null

  const scheduledTrucksCount = operationsData?.trucks?.scheduled_deliveries?.length || 0
  const activeTransfersCount = (operationsData?.actions || []).filter(
    (a) => (a.action_type === 'TRANSFER' || a.action_type === 'EARLIER_TRUCK') && a.status !== 'REJECTED'
  ).length
  const totalDeliveriesCount = scheduledTrucksCount + activeTransfersCount

  const riderShortage = operationsData?.riders?.rider_shortage_count ?? null
  const riderSurge = operationsData?.riders?.rider_surge_multiplier ?? 1.0

  if (isLoading && !operationsData) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-slate-500 text-sm font-medium">
          Loading Dark Store Operations Telemetry for {selectedStoreId}...
        </div>
      </div>
    )
  }

  if (error && !operationsData) {
    return (
      <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="space-y-1">
          <div className="text-rose-900 font-bold text-base">Failed to Load Operations Data</div>
          <div className="text-rose-700 text-xs max-w-md mx-auto">{error.message}</div>
        </div>
        <Button variant="primary" onClick={loadOperations}>
          Retry Operations Telemetry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Top Context & Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Dark Store Operations Command
            </h1>
            <Badge
              variant={dataSourceMode === 'mock' ? 'neutral' : 'primary'}
              dot={true}
              className="text-[10px]"
            >
              {dataSourceMode === 'mock' ? 'MOCK TELEMETRY' : 'LIVE TELEMETRY'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time physical stock replenishment, delivery tracking, and courier fleet capacity for{' '}
            <strong className="text-slate-700 font-mono">{selectedStoreId}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 font-mono">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadOperations}
            disabled={isLoading}
            className="text-xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <OperationsKpiSummary
        tasksCount={tasks.length}
        activeDeliveriesCount={totalDeliveriesCount}
        riderShortages={riderShortage}
        riderSurge={riderSurge}
        shelfFillPercent={avgShelfFill}
        hasGhostStockout={hasGhostStockout}
      />

      {/* Feature 3E: Operational Blockages Banner */}
      <OperationalBlockages
        inventory={operationsData?.inventory}
        riders={operationsData?.riders}
        alerts={operationsData?.alerts}
        trucks={operationsData?.trucks}
        storeId={selectedStoreId}
      />

      {/* Main Operations Grid: Balanced 2-column layout on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Tasks & Shelf Inventory */}
        <div className="space-y-6">
          {/* Feature 3A: Operations Task Board */}
          <OperationsTaskBoard
            tasks={tasks}
            dataSourceMode={dataSourceMode}
          />

          {/* Feature 3C: Shelf vs Backroom Inventory */}
          <ShelfInventoryView
            inventory={operationsData?.inventory}
            storeId={selectedStoreId}
          />
        </div>

        {/* Right Column: Transfer Tracker & Rider Capacity */}
        <div className="space-y-6">
          {/* Feature 3B: Transfer Tracker */}
          <TransferTracker
            trucks={operationsData?.trucks}
            actions={operationsData?.actions}
            alerts={operationsData?.alerts}
            riders={operationsData?.riders}
            storeId={selectedStoreId}
          />

          {/* Feature 3D: Rider Fleet Capacity */}
          <RiderCapacityCard
            riders={operationsData?.riders}
            events={operationsData?.events}
            storeId={selectedStoreId}
          />
        </div>

      </div>

    </div>
  )
}
