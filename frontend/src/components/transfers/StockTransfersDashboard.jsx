import React, { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeftRight,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  RotateCcw,
  AlertCircle,
  Package,
  Store,
  ChevronRight,
  ShieldCheck,
  Check,
  Building2,
  BadgeAlert,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react'
import {
  fetchTransfers,
  fetchDonorsForSku,
  createTransferRequest,
  respondToTransfer,
  dispatchTransfer,
  receiveTransfer
} from '../../services/transferService'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../common/Card'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'

const CANDIDATE_STORES = [
  { id: 'STORE_003', name: 'Store 3 - Domlur Hub', zone: 'Domlur', distance: '3.4 km' },
  { id: 'STORE_007', name: 'Store 7 - Koramangala Tech Park', zone: 'Koramangala', distance: '1.4 km' },
  { id: 'STORE_012', name: 'Store 12 - Marathahalli Bridge', zone: 'Marathahalli', distance: '11.2 km' },
  { id: 'STORE_002', name: 'Store 2 - MG Road Central', zone: 'Central', distance: '0.8 km' },
  { id: 'STORE_009', name: 'Store 9 - Jayanagar 4th Block', zone: 'Jayanagar', distance: '4.5 km' },
]

const POPULAR_SKUS = [
  { id: 'SKU_COLD_DRINK_750ML', name: 'Sparkling Cola 750ml', category: 'Cold Beverages' },
  { id: 'SKU_CHIPS_SALTED_100G', name: 'Classic Salted Potato Chips 100g', category: 'Snacks & Chips' },
  { id: 'SKU_DIET_HERBAL_TEA_250ML', name: 'Diet Herbal Tea 250ml', category: 'Health & Wellness' },
  { id: 'SKU_ENERGY_DRINK_500ML', name: 'Pulse Energy Drink 500ml', category: 'Cold Beverages' },
]

export function StockTransfersDashboard({ currentUser }) {
  const currentStoreId = currentUser?.store_id || 'STORE_007'

  const [transfers, setTransfers] = useState([])
  const [pendingIncomingCount, setPendingIncomingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null)

  // New Request Form State
  const [showNewRequestForm, setShowNewRequestForm] = useState(false)
  const [targetStoreId, setTargetStoreId] = useState(
    currentStoreId === 'STORE_007' ? 'STORE_003' : 'STORE_007'
  )
  const [selectedSkuId, setSelectedSkuId] = useState('SKU_COLD_DRINK_750ML')
  const [quantity, setQuantity] = useState(25)
  const [notes, setNotes] = useState('')
  const [donorStockInfo, setDonorStockInfo] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Rejection modal / inline state
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('Insufficient surplus stock buffer')
  
  // Partial modal / inline state
  const [partialId, setPartialId] = useState(null)
  const [partialQty, setPartialQty] = useState(15)

  const loadTransfers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchTransfers('all')
      setTransfers(data.transfers || [])
      setPendingIncomingCount(data.pending_incoming_count || 0)
    } catch (err) {
      console.error('Failed to load transfers:', err)
      setError(err.message || 'Failed to retrieve transfers from backend.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTransfers()
  }, [loadTransfers])

  // Check donor store availability when target store or SKU changes in form
  useEffect(() => {
    let active = true
    async function checkAvailability() {
      try {
        const data = await fetchDonorsForSku(selectedSkuId)
        if (!active) return
        const donor = data.donor_stores?.find((d) => d.store_id === targetStoreId)
        setDonorStockInfo(donor || null)
      } catch (err) {
        console.warn('Failed to fetch donor stock:', err)
      }
    }
    if (showNewRequestForm) {
      checkAvailability()
    }
    return () => {
      active = false
    }
  }, [selectedSkuId, targetStoreId, showNewRequestForm])

  const handleCreateRequest = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setActionSuccessMsg(null)
    try {
      const created = await createTransferRequest({
        to_store_id: targetStoreId,
        sku_id: selectedSkuId,
        requested_quantity: quantity,
        notes,
      })
      setActionSuccessMsg(`Transfer request ${created.transfer_id} successfully submitted to ${created.to_store_name}!`)
      setShowNewRequestForm(false)
      setNotes('')
      await loadTransfers()
    } catch (err) {
      console.error('Create transfer failed:', err)
      setError(err.message || 'Failed to submit stock transfer request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRespond = async (transferId, action, approvedQuantity, reason) => {
    setError(null)
    setActionSuccessMsg(null)
    try {
      const updated = await respondToTransfer(transferId, {
        action,
        approved_quantity: approvedQuantity,
        rejection_reason: reason,
      })
      setActionSuccessMsg(
        action === 'REJECT'
          ? `Request ${transferId} rejected.`
          : `Request ${transferId} approved for ${updated.approved_quantity} units!`
      )
      setRejectingId(null)
      setPartialId(null)
      await loadTransfers()
    } catch (err) {
      console.error('Respond failed:', err)
      setError(err.message || 'Failed to respond to transfer.')
    }
  }

  const handleDispatch = async (transferId) => {
    setError(null)
    setActionSuccessMsg(null)
    try {
      await dispatchTransfer(transferId)
      setActionSuccessMsg(`Transfer ${transferId} dispatched with hyper-local rider! Status: IN_TRANSIT.`)
      await loadTransfers()
    } catch (err) {
      console.error('Dispatch failed:', err)
      setError(err.message || 'Failed to dispatch transfer.')
    }
  }

  const handleReceive = async (transferId) => {
    setError(null)
    setActionSuccessMsg(null)
    try {
      const updated = await receiveTransfer(transferId)
      setActionSuccessMsg(`Stock verified & received! Current inventory for ${updated.sku_name} updated to ${updated.dest_current_stock} units.`)
      await loadTransfers()
    } catch (err) {
      console.error('Receive failed:', err)
      setError(err.message || 'Failed to confirm receipt.')
    }
  }

  // Incoming vs Outgoing
  const incomingRequests = transfers.filter((t) => t.to_store_id === currentStoreId && t.status === 'PENDING')
  const otherTransfers = transfers.filter((t) => !(t.to_store_id === currentStoreId && t.status === 'PENDING'))

  return (
    <div className="space-y-6">

      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-teal-700" />
              Manager-to-Manager Stock Transfers
            </h1>
            <Badge variant="primary">Live SQLite Network</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authenticated Manager Store: <span className="font-semibold text-teal-800">{currentStoreId}</span> ({currentUser?.store_name || currentStoreId})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={loadTransfers}
            disabled={isLoading}
            className="text-xs flex items-center gap-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            onClick={() => setShowNewRequestForm(!showNewRequestForm)}
            className="text-xs flex items-center gap-1.5 bg-teal-800 hover:bg-teal-900 text-white cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {showNewRequestForm ? 'Close Form' : 'Request Stock from Another Store'}
          </Button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Error:</span> {error}
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs text-rose-700 hover:text-rose-900 font-bold px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* New Request Modal / Collapse Form */}
      {showNewRequestForm && (
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50/40 via-white to-white ring-1 ring-teal-500/20 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-teal-950 flex items-center gap-2">
                  <Send className="w-4 h-4 text-teal-700" />
                  Create Inter-Store Stock Request
                </CardTitle>
                <CardDescription className="text-xs">
                  Request units from a candidate donor store. Target manager must evaluate and approve.
                </CardDescription>
              </div>
              <Badge variant="success" dot={true}>
                Your Store: {currentStoreId}
              </Badge>
            </div>
          </CardHeader>

          <form onSubmit={handleCreateRequest}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Target Store Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Donor Store
                  </label>
                  <select
                    value={targetStoreId}
                    onChange={(e) => setTargetStoreId(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
                  >
                    {CANDIDATE_STORES.filter((s) => s.id !== currentStoreId).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id}: {s.name} ({s.distance})
                      </option>
                    ))}
                  </select>
                </div>

                {/* SKU Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Product SKU
                  </label>
                  <select
                    value={selectedSkuId}
                    onChange={(e) => setSelectedSkuId(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
                  >
                    {POPULAR_SKUS.map((sku) => (
                      <option key={sku.id} value={sku.id}>
                        {sku.name} ({sku.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Requested Quantity</span>
                    {donorStockInfo && (
                      <span className="text-[11px] font-bold text-teal-800">
                        Donor Stock: {donorStockInfo.available_stock_units} units
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={donorStockInfo ? donorStockInfo.available_stock_units : 500}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Request Reason / Operational Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Critical stockout risk ahead of T20 World Cup match surge"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>

              {/* Proximity / Stock check badge */}
              {donorStockInfo && (
                <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-teal-700" />
                    <span>
                      Donor Store has <span className="font-bold text-teal-900">{donorStockInfo.available_stock_units} total units</span> available in {donorStockInfo.location_zone}.
                    </span>
                  </div>
                  <span className="font-bold text-teal-800 text-[11px]">
                    Proximity: {donorStockInfo.stadium_proximity_km} km
                  </span>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex items-center justify-end gap-2 bg-slate-50/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewRequestForm(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="text-xs bg-teal-800 hover:bg-teal-900 text-white font-semibold cursor-pointer"
              >
                {isSubmitting ? 'Submitting...' : 'Send Transfer Request'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Priority Section: Incoming Requests Requiring Decision */}
      {incomingRequests.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30 ring-1 ring-amber-400/30 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BadgeAlert className="w-5 h-5 text-amber-600 animate-pulse" />
                <CardTitle className="text-base text-amber-950">
                  Action Required: Incoming Stock Requests ({incomingRequests.length})
                </CardTitle>
              </div>
              <Badge variant="warning" dot={true}>
                Decision Pending
              </Badge>
            </div>
            <CardDescription className="text-xs text-amber-900/80">
              Other dark store managers are requesting inventory from your store. Accept in full, partially, or reject with reason.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {incomingRequests.map((req) => (
              <div
                key={req.transfer_id}
                className="p-4 rounded-xl bg-white border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      {req.transfer_id}
                    </span>
                    <span className="text-xs text-slate-500">From:</span>
                    <span className="text-xs font-bold text-slate-900">
                      {req.from_store_name} ({req.from_store_id})
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span>{req.sku_name}</span>
                    <span className="text-xs font-normal text-slate-500 font-mono">({req.sku_id})</span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-3">
                    <span>Requested: <strong className="text-amber-800 font-mono">{req.requested_quantity} units</strong></span>
                    <span>•</span>
                    <span>Your Current Stock: <strong className="text-teal-800 font-mono">{req.donor_current_stock} units</strong></span>
                    {req.notes && (
                      <>
                        <span>•</span>
                        <span className="italic text-slate-500">"{req.notes}"</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Decision Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Accept Full */}
                  <Button
                    variant="primary"
                    onClick={() => handleRespond(req.transfer_id, 'ACCEPT_ALL')}
                    disabled={req.requested_quantity > req.donor_current_stock}
                    className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept All ({req.requested_quantity})
                  </Button>

                  {/* Accept Partial Button / Form */}
                  {partialId === req.transfer_id ? (
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-300">
                      <input
                        type="number"
                        min="1"
                        max={Math.min(req.requested_quantity, req.donor_current_stock)}
                        value={partialQty}
                        onChange={(e) => setPartialQty(Number(e.target.value))}
                        className="w-16 px-2 py-1 text-xs border rounded-lg font-mono font-bold"
                      />
                      <Button
                        variant="primary"
                        onClick={() => handleRespond(req.transfer_id, 'ACCEPT_PARTIAL', partialQty)}
                        className="text-xs py-1 px-2.5 bg-teal-700 text-white cursor-pointer"
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPartialId(null)}
                        className="text-xs py-1 px-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPartialId(req.transfer_id)
                        setPartialQty(Math.floor(req.requested_quantity / 2) || 10)
                      }}
                      className="text-xs cursor-pointer"
                    >
                      Accept Partial...
                    </Button>
                  )}

                  {/* Reject Button / Form */}
                  {rejectingId === req.transfer_id ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-xl border border-rose-200">
                      <select
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="text-xs py-1 px-2 border border-rose-300 rounded-lg bg-white"
                      >
                        <option value="Insufficient surplus stock buffer">Buffer too low</option>
                        <option value="Rider unavailable due to weather/shortage">Rider unavailable</option>
                        <option value="High local footfall expected">Local surge expected</option>
                      </select>
                      <Button
                        variant="critical"
                        onClick={() => handleRespond(req.transfer_id, 'REJECT', 0, rejectionReason)}
                        className="text-xs py-1 px-2.5 bg-rose-600 text-white cursor-pointer"
                      >
                        Confirm Reject
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setRejectingId(null)}
                        className="text-xs py-1 px-2"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setRejectingId(req.transfer_id)}
                      className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50 cursor-pointer"
                    >
                      Reject...
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Ledger: Active, In-Transit & Historical Stock Transfers */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-slate-900">
                Active & Historical Transfer Requests ({transfers.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Complete persisted audit trail for peer-to-peer stock movements involving your dark store.
              </CardDescription>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Auto-persisted to SQLite
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {transfers.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-700">No stock transfers found</div>
              <p className="text-xs text-slate-400">
                Click "Request Stock from Another Store" to initiate your first inter-store transfer.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] bg-slate-50/50">
                    <th className="py-2.5 px-3">Transfer ID</th>
                    <th className="py-2.5 px-3">Route (Requester → Donor)</th>
                    <th className="py-2.5 px-3">Product SKU</th>
                    <th className="py-2.5 px-3">Units (Req / Appr)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">ETA / Timeline</th>
                    <th className="py-2.5 px-3 text-right">Workflow Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transfers.map((t) => {
                    const isRequester = t.from_store_id === currentStoreId
                    const isDonor = t.to_store_id === currentStoreId

                    return (
                      <tr key={t.transfer_id} className="hover:bg-slate-50/60 transition-colors">
                        
                        {/* Transfer ID */}
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {t.transfer_id}
                        </td>

                        {/* Route */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <span className={isRequester ? 'text-teal-800 font-bold' : 'text-slate-600'}>
                              {t.from_store_id}
                            </span>
                            <ArrowLeftRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className={isDonor ? 'text-teal-800 font-bold' : 'text-slate-600'}>
                              {t.to_store_id}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {isRequester ? 'Outgoing Request' : 'Incoming Fulfillment'}
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{t.sku_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{t.sku_id}</div>
                        </td>

                        {/* Quantities */}
                        <td className="py-3 px-3 font-mono">
                          <span className="font-bold text-slate-800">{t.requested_quantity} req</span>
                          {t.approved_quantity !== null && (
                            <span className="ml-1 text-teal-700 font-bold">
                              / {t.approved_quantity} app
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {t.status === 'PENDING' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              PENDING
                            </span>
                          )}
                          {t.status === 'ACCEPTED' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              ACCEPTED
                            </span>
                          )}
                          {t.status === 'IN_TRANSIT' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              IN_TRANSIT
                            </span>
                          )}
                          {t.status === 'DELIVERED' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              DELIVERED
                            </span>
                          )}
                          {t.status === 'REJECTED' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200" title={t.rejection_reason}>
                              REJECTED
                            </span>
                          )}
                          {t.rejection_reason && (
                            <div className="text-[10px] text-rose-600 mt-0.5 italic max-w-[140px] truncate" title={t.rejection_reason}>
                              {t.rejection_reason}
                            </div>
                          )}
                        </td>

                        {/* Timeline */}
                        <td className="py-3 px-3 text-[11px] text-slate-600">
                          {t.status === 'IN_TRANSIT' ? (
                            <div className="flex items-center gap-1 text-purple-700 font-semibold">
                              <Truck className="w-3.5 h-3.5" />
                              <span>ETA: ~{t.eta_minutes || 25} mins</span>
                            </div>
                          ) : t.status === 'DELIVERED' ? (
                            <div className="text-emerald-700 font-medium">
                              Received & Stock Credited
                            </div>
                          ) : (
                            <div className="text-slate-400">
                              {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </td>

                        {/* Workflow Action */}
                        <td className="py-3 px-3 text-right">
                          {t.status === 'ACCEPTED' && (
                            <Button
                              variant="primary"
                              onClick={() => handleDispatch(t.transfer_id)}
                              className="text-xs py-1 px-2.5 bg-purple-700 hover:bg-purple-800 text-white cursor-pointer inline-flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3" />
                              Dispatch Rider
                            </Button>
                          )}

                          {t.status === 'IN_TRANSIT' && isRequester && (
                            <Button
                              variant="primary"
                              onClick={() => handleReceive(t.transfer_id)}
                              className="text-xs py-1 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Confirm Delivery
                            </Button>
                          )}

                          {t.status === 'DELIVERED' && (
                            <span className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> Completed
                            </span>
                          )}

                          {t.status === 'REJECTED' && (
                            <span className="text-[11px] text-rose-600">
                              Closed
                            </span>
                          )}

                          {t.status === 'PENDING' && isRequester && (
                            <span className="text-[11px] text-amber-700 italic">
                              Awaiting Donor Mgr
                            </span>
                          )}
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-slate-50/50 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Strict server-side validation: Stock levels are updated atomically on delivery confirmation.</span>
          </div>
          <div>
            Showing {transfers.length} records
          </div>
        </CardFooter>
      </Card>

    </div>
  )
}
