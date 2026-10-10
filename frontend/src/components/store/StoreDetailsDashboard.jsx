import React, { useState, useEffect, useCallback } from 'react'
import {
  RotateCcw,
  AlertCircle,
  Store,
  Boxes,
  TrendingUp,
  Sparkles,
  Truck
} from 'lucide-react'
import { fetchStoreDetailsData } from '../../services/storeService'
import { getDataSourceMode } from '../../api/client'
import { StoreOverviewCard } from './StoreOverviewCard'
import { StoreInventoryTable } from './StoreInventoryTable'
import { DemandForecastChart } from './DemandForecastChart'
import { ActiveEventsCard } from './ActiveEventsCard'
import { StoreLogisticsPanel } from './StoreLogisticsPanel'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'

export function StoreDetailsDashboard({
  selectedStoreId = 'STORE_007',
  onSelectStore,
}) {
  const [storeData, setStoreData] = useState(null)
  const [activeSkuId, setActiveSkuId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const dataSourceMode = getDataSourceMode()

  const loadStoreDetails = useCallback(async (skuOverride = null) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchStoreDetailsData(selectedStoreId, skuOverride || activeSkuId)
      setStoreData(data)
      if (!activeSkuId || skuOverride) {
        setActiveSkuId(data.primarySkuId)
      }
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[StoreDetailsDashboard] Error loading data:', err)
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedStoreId, activeSkuId, dataSourceMode])

  useEffect(() => {
    loadStoreDetails()
  }, [selectedStoreId, dataSourceMode])

  const handleSelectSku = (skuId) => {
    setActiveSkuId(skuId)
    loadStoreDetails(skuId)
  }

  // Active SKU metadata
  const skus = storeData?.inventory?.skus || []
  const currentSku = skus.find((s) => s.sku_id === activeSkuId) || skus[0] || null
  const currentStockUnits = currentSku ? (currentSku.shelf_stock_units ?? 0) + (currentSku.backroom_stock_units ?? 0) : 55

  if (isLoading && !storeData) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-slate-500 text-sm font-medium">
          Loading Dark Store Telemetry & Inventory for {selectedStoreId}...
        </div>
      </div>
    )
  }

  if (error && !storeData) {
    return (
      <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <div className="space-y-1">
          <div className="text-rose-900 font-bold text-base">Failed to Load Store Details</div>
          <div className="text-rose-700 text-xs max-w-md mx-auto">{error.message}</div>
        </div>
        <Button variant="primary" onClick={() => loadStoreDetails()}>
          Retry Store Telemetry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header & Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Dark Store Overview & Demand Curves
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
            Store location telemetry, physical shelf breakdown, demand forecast curves, and supply logistics for{' '}
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
            onClick={() => loadStoreDetails()}
            disabled={isLoading}
            className="text-xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 1. Store Overview & Health Summary */}
      <StoreOverviewCard
        storeMetadata={storeData?.storeMetadata}
        selectedStoreId={selectedStoreId}
        onSelectStore={onSelectStore}
        alerts={storeData?.alerts}
        inventory={storeData?.inventory}
        dataSourceMode={dataSourceMode}
      />

      {/* 2. Physical Inventory & SKU Stock Ledger */}
      <StoreInventoryTable
        inventory={storeData?.inventory}
        alerts={storeData?.alerts}
        selectedSkuId={activeSkuId}
        onSelectSku={handleSelectSku}
        storeId={selectedStoreId}
      />

      {/* 3. Demand Forecast Curve */}
      <DemandForecastChart
        forecast={storeData?.forecast}
        skuId={currentSku?.sku_id || activeSkuId}
        skuName={currentSku?.sku_name || activeSkuId}
        currentStock={currentStockUnits}
        dataSourceMode={dataSourceMode}
      />

      {/* 4. Active External Events & Demand Drivers */}
      <ActiveEventsCard
        events={storeData?.events}
        storeId={selectedStoreId}
        dataSourceMode={dataSourceMode}
      />

      {/* 5. Supporting Supply Network & Replenishment Feeds */}
      <StoreLogisticsPanel
        warehouse={storeData?.warehouse}
        donors={storeData?.donors}
        trucks={storeData?.trucks}
        targetSkuId={currentSku?.sku_id || activeSkuId}
        storeId={selectedStoreId}
      />

    </div>
  )
}
