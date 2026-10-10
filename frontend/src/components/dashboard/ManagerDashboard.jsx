import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Database,
  ShieldAlert,
  X
} from 'lucide-react'
import { KpiCards } from './KpiCards'
import { AlertQueue } from './AlertQueue'
import { RiskTimelineChart } from './RiskTimelineChart'
import { RecommendationDeck } from './RecommendationDeck'
import { ApprovalModal } from './ApprovalModal'
import { RejectionModal } from './RejectionModal'
import {
  fetchStockoutAlerts,
  fetchRecommendations,
  fetchHourlyForecast,
  fetchRiderFleet,
  fetchStoreInventory,
  approveRecommendation,
  rejectRecommendation,
} from '../../services/managerService'
import { getDataSourceMode } from '../../api/client'

export function ManagerDashboard({ selectedStoreId = 'STORE_007' }) {
  const [alerts, setAlerts] = useState([])
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [forecastData, setForecastData] = useState([])
  const [horizonLabel, setHorizonLabel] = useState('5-Hour Forecast Window (Contract Horizon)')

  const [riderFleetData, setRiderFleetData] = useState(null)
  const [inventoryData, setInventoryData] = useState(null)

  const [loadingAlerts, setLoadingAlerts] = useState(true)
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [loadingForecast, setLoadingForecast] = useState(false)

  const [error, setError] = useState(null)
  const [actionFeedback, setActionFeedback] = useState(null)

  // Modal States
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [targetRecommendation, setTargetRecommendation] = useState(null)
  const [isEditQuantityMode, setIsEditQuantityMode] = useState(false)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [actionError, setActionError] = useState(null)

  const dataSourceMode = getDataSourceMode()

  // 1. Load alerts, rider fleet, and store inventory on mount or store change
  useEffect(() => {
    loadAlertsAndContext()
  }, [selectedStoreId, dataSourceMode])

  const loadAlertsAndContext = async () => {
    setLoadingAlerts(true)
    setError(null)

    try {
      // Parallel fetch for alerts, logistics fleet, and store inventory
      const [alertsRes, fleetRes, invRes] = await Promise.all([
        fetchStockoutAlerts(selectedStoreId),
        fetchRiderFleet(selectedStoreId),
        fetchStoreInventory(selectedStoreId),
      ])

      setAlerts(alertsRes.alerts || [])
      setRiderFleetData(fleetRes?.riderFleet || null)
      setInventoryData(invRes?.inventory || null)

      if (alertsRes.alerts && alertsRes.alerts.length > 0) {
        setSelectedAlert(alertsRes.alerts[0])
      } else {
        setSelectedAlert(null)
      }
    } catch (err) {
      console.error('Failed to load alerts and context:', err)
      setError(err)
    } finally {
      setLoadingAlerts(false)
    }
  }

  // 2. Load recommendations & forecast when selectedAlert changes
  useEffect(() => {
    if (selectedAlert) {
      loadAlertDetails(selectedAlert)
    } else {
      setRecommendations([])
      setForecastData([])
    }
  }, [selectedAlert, dataSourceMode])

  const loadAlertDetails = async (alert) => {
    setLoadingRecs(true)
    setLoadingForecast(true)
    setActionError(null)

    try {
      const [recsRes, forecastRes] = await Promise.all([
        fetchRecommendations(alert.alert_id),
        fetchHourlyForecast(alert.store_id, alert.sku_id),
      ])

      setRecommendations(recsRes.recommendations || [])
      setForecastData(forecastRes.forecastIntervals || [])
      setHorizonLabel(forecastRes.horizonNote || '5-Hour Forecast Window (Contract Horizon)')
    } catch (err) {
      console.error('Failed to load alert details:', err)
      setError(err)
    } finally {
      setLoadingRecs(false)
      setLoadingForecast(false)
    }
  }

  // 3. Approval Handlers
  const handleOpenApprove = (rec, editQty = false) => {
    setTargetRecommendation(rec)
    setIsEditQuantityMode(editQty)
    setActionError(null)
    setApprovalModalOpen(true)
  }

  const handleConfirmApprove = async (payload) => {
    if (!targetRecommendation) return
    setIsSubmittingAction(true)
    setActionError(null)

    try {
      const result = await approveRecommendation(
        targetRecommendation.recommendation_id,
        payload
      )

      setApprovalModalOpen(false)
      setActionFeedback({
        type: 'APPROVED',
        title: `Recommendation #${targetRecommendation.rank} Approved`,
        message: result.action_summary || `Action ID: ${result.action_id} recorded successfully.`,
        actionId: result.action_id,
        status: result.status,
      })

      if (selectedAlert) {
        const updatedRecs = await fetchRecommendations(selectedAlert.alert_id)
        setRecommendations(updatedRecs.recommendations || [])
      }
    } catch (err) {
      setActionError(err)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  // 4. Rejection Handlers
  const handleOpenReject = (rec) => {
    setTargetRecommendation(rec)
    setActionError(null)
    setRejectionModalOpen(true)
  }

  const handleConfirmReject = async (payload) => {
    if (!targetRecommendation) return
    setIsSubmittingAction(true)
    setActionError(null)

    try {
      const result = await rejectRecommendation(
        targetRecommendation.recommendation_id,
        payload
      )

      setRejectionModalOpen(false)
      setActionFeedback({
        type: 'REJECTED',
        title: `Recommendation #${targetRecommendation.rank} Rejected`,
        message: `Reason: ${payload.rejectionReason}. Rejection recorded in audit trail.`,
        status: result.status,
      })

      if (selectedAlert) {
        const updatedRecs = await fetchRecommendations(selectedAlert.alert_id)
        setRecommendations(updatedRecs.recommendations || [])
      }
    } catch (err) {
      setActionError(err)
    } finally {
      setIsSubmittingAction(false)
    }
  }

  // ==========================================
  // Accurate, Contract-Aligned Metric Calculations
  // ==========================================
  const waitOption = recommendations.find((r) => r.option_type === 'WAIT')
  const topRec = recommendations.find((r) => r.is_recommended) || recommendations[0]

  // 1. Revenue at Risk (Gross Sales Loss):
  // Sourced from WAIT option's direct loss, topRec revenue_saved, or SKU price * unit deficit
  let revenueAtRisk = null
  if (waitOption?.financial_impact?.net_gain_inr !== undefined && waitOption.financial_impact.net_gain_inr < 0) {
    revenueAtRisk = Math.abs(waitOption.financial_impact.net_gain_inr)
  } else if (topRec?.financial_impact?.revenue_saved_inr !== undefined && topRec.financial_impact.revenue_saved_inr > 0) {
    revenueAtRisk = topRec.financial_impact.revenue_saved_inr
  } else if (inventoryData?.skus && selectedAlert) {
    const skuItem = inventoryData.skus.find((s) => s.sku_id === selectedAlert.sku_id)
    if (skuItem?.unit_selling_price_inr) {
      const demand = selectedAlert.projected_hourly_demand_units ?? selectedAlert.projected_hourly_demand ?? 0
      const stock = selectedAlert.current_total_stock_units ?? selectedAlert.current_total_stock ?? 0
      const deficit = Math.max(0, demand - stock)
      revenueAtRisk = deficit > 0 ? deficit * skuItem.unit_selling_price_inr : null
    }
  }

  // 2. Profit Margin at Risk:
  // If SKU selling price and cost price are available, calculate margin ratio
  let profitMarginAtRisk = null
  if (inventoryData?.skus && selectedAlert && revenueAtRisk) {
    const skuItem = inventoryData.skus.find((s) => s.sku_id === selectedAlert.sku_id)
    if (skuItem?.unit_selling_price_inr && skuItem?.unit_cost_price_inr) {
      const marginRatio = (skuItem.unit_selling_price_inr - skuItem.unit_cost_price_inr) / skuItem.unit_selling_price_inr
      profitMarginAtRisk = Number((revenueAtRisk * marginRatio).toFixed(2))
    }
  }

  // 3. Protected Value:
  const protectedValue = topRec?.financial_impact?.net_gain_inr ?? null

  // 4. Dynamic Net Gain Percentage:
  let netGainPercentage = null
  if (protectedValue !== null && revenueAtRisk && revenueAtRisk > 0) {
    netGainPercentage = Number(((protectedValue / revenueAtRisk) * 100).toFixed(1))
  }

  // 5. Dynamic Rider Fleet Metrics:
  const riderShortages = riderFleetData?.rider_shortage_count ?? null
  const activeRiders = riderFleetData?.available_riders ?? riderFleetData?.active_riders ?? null
  const requiredRiders = riderFleetData?.required_riders_for_demand ?? riderFleetData?.required_riders ?? null
  const riderSurge = riderFleetData?.rider_surge_multiplier ?? null

  // 6. Network Scope (Distinguishing mock 30-store master vs live 12 covered dark stores):
  const networkHealthData = dataSourceMode === 'mock'
    ? { atRiskCount: alerts.length, totalStores: 30, stableStores: Math.max(0, 30 - alerts.length), isLive: false }
    : { atRiskCount: alerts.length, totalStores: 12, stableStores: Math.max(0, 12 - alerts.length), isLive: true }

  // 7. Dynamic Subtitles:
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length
  const revenueSubtitle = selectedAlert
    ? `${criticalCount} Critical • ${selectedAlert.store_name || selectedAlert.store_id}`
    : 'No active stockout alert'

  const protectedSubtitle = topRec
    ? `Top: #${topRec.rank} ${topRec.title}`
    : 'Awaiting recommendation selection'

  const stockoutSubtitle = selectedAlert
    ? `${selectedAlert.minutes_until_stockout ? `Within ${selectedAlert.minutes_until_stockout} mins` : 'Pending'} • ${selectedAlert.sku_name || selectedAlert.sku_id}`
    : 'No active stockout alert'

  const riderSubtitle = riderFleetData
    ? (riderShortages > 0 ? `${activeRiders} / ${requiredRiders} Active • Surge: ${riderSurge}x` : 'Fleet operating normally')
    : 'Rider fleet status unavailable'

  const networkSubtitle = dataSourceMode === 'mock'
    ? `${alerts.length} dark stores at risk (Mock Network Master)`
    : `12 Covered Dark Stores (Challenge 06 Dataset)`

  return (
    <div className="space-y-6">
      
      {/* Action Result Feedback Banner */}
      {actionFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">
                {actionFeedback.title}
              </div>
              <div className="text-emerald-700 mt-0.5">
                {actionFeedback.message} {actionFeedback.actionId && <span className="font-mono font-bold">({actionFeedback.actionId})</span>}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Error Banner if API Fails */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <span className="font-bold block">Live API Communication Notice</span>
              <span>{error.message || String(error)}</span>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Top KPI Metrics Banner */}
      <KpiCards
        revenueAtRisk={revenueAtRisk}
        profitMarginAtRisk={profitMarginAtRisk}
        revenueSubtitle={revenueSubtitle}
        criticalAlertsCount={criticalCount}
        protectedValue={protectedValue}
        netGainPercentage={netGainPercentage}
        protectedSubtitle={protectedSubtitle}
        expectedStockouts={alerts.length}
        stockoutSubtitle={stockoutSubtitle}
        riderShortages={riderShortages}
        riderSurge={riderSurge}
        riderSubtitle={riderSubtitle}
        networkHealthData={networkHealthData}
        networkSubtitle={networkSubtitle}
        dataSourceMode={dataSourceMode}
      />

      {/* 2. Main Decision Grid: Alert Queue (Left) & Risk + Recommendations (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Ranked Alert Queue */}
        <div className="lg:col-span-4 xl:col-span-4">
          <AlertQueue
            alerts={alerts}
            selectedAlertId={selectedAlert?.alert_id}
            onSelectAlert={setSelectedAlert}
            loading={loadingAlerts}
            error={error}
            onRefresh={loadAlertsAndContext}
          />
        </div>

        {/* Right Column: Timeline Trajectory & Recommendation Deck */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-6">
          
          {/* Stockout Risk Timeline Curve */}
          <RiskTimelineChart
            forecastData={forecastData}
            horizonLabel={horizonLabel}
            initialStock={selectedAlert?.current_total_stock_units ?? selectedAlert?.current_total_stock ?? 55}
            stockoutMinutes={selectedAlert?.minutes_until_stockout ?? 42}
            storeName={selectedAlert?.store_name ?? selectedAlert?.store_id ?? 'Store 7'}
            skuName={selectedAlert?.sku_name ?? selectedAlert?.sku_id ?? 'Sparkling Cola 750ml'}
          />

          {/* 4 Resolution Strategies Comparison Deck */}
          <RecommendationDeck
            recommendations={recommendations}
            onApprove={(rec) => handleOpenApprove(rec, false)}
            onEditQuantityApprove={(rec) => handleOpenApprove(rec, true)}
            onReject={handleOpenReject}
            loading={loadingRecs}
            alertId={selectedAlert?.alert_id || 'ALT_20261009_007_01'}
          />

        </div>
      </div>

      {/* Approval Confirmation & Quantity Override Modal */}
      <ApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        recommendation={targetRecommendation}
        onConfirmApprove={handleConfirmApprove}
        initialEditQuantity={isEditQuantityMode}
        isSubmitting={isSubmittingAction}
        error={actionError}
      />

      {/* Rejection Feedback Modal */}
      <RejectionModal
        isOpen={rejectionModalOpen}
        onClose={() => setRejectionModalOpen(false)}
        recommendation={targetRecommendation}
        onConfirmReject={handleConfirmReject}
        isSubmitting={isSubmittingAction}
        error={actionError}
      />

    </div>
  )
}
