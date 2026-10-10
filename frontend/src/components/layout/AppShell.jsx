import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Truck,
  Store,
  FileText,
  Sliders,
  ShieldAlert,
  ArrowRight,
  Database,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import { Sidebar, NAVIGATION_ITEMS } from './Sidebar'
import { Header } from './Header'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../common/Card'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { StatusIndicator } from '../common/StatusIndicator'
import { getDataSourceMode, setDataSourceMode } from '../../api/client'
import { ManagerDashboard } from '../dashboard/ManagerDashboard'
import { OperationsDashboard } from '../operations/OperationsDashboard'
import { StoreDetailsDashboard } from '../store/StoreDetailsDashboard'
import { ActionLogDashboard } from '../actions/ActionLogDashboard'
import { SimulationDashboard } from '../simulation/SimulationDashboard'
import { StockTransfersDashboard } from '../transfers/StockTransfersDashboard'
import { fetchTransfers } from '../../services/transferService'

// Placeholder definitions for each navigation route
const ROUTE_METADATA = {
  manager: {
    title: 'Manager Dashboard',
    description: '4-hour stockout alert queue, recommendation evaluation deck & approval actions',
    endpoints: ['GET /api/v1/alerts/stockouts', 'GET /api/v1/recommendations', 'POST /recommendations/{id}/approve', 'POST /recommendations/{id}/reject'],
    plannedFeatures: [
      'Top KPI metric cards (Margin at Risk ₹, Protected Value ₹, Expected Stock-outs, Rider Problems)',
      'Ranked list of pending 4-hour stock-out alerts',
      'Stock-out risk timeline chart (inventory depletion trajectory)',
      'Side-by-side comparison of 4 resolution options (Transfer, Earlier Truck, Shelf Swap, Wait)',
      'Approve, Edit Quantity, and Reject with mandatory reason workflows',
    ],
  },
  transfers: {
    title: 'Stock Transfers',
    description: 'Peer-to-peer dark store stock request, authorization & delivery tracking',
    endpoints: [
      'GET /api/v1/transfers',
      'POST /api/v1/transfers',
      'POST /api/v1/transfers/{id}/respond',
      'POST /api/v1/transfers/{id}/dispatch',
      'POST /api/v1/transfers/{id}/receive'
    ],
    plannedFeatures: [
      'Manager A inter-store stock request submission',
      'Manager B accept full, partial, or reject with reason',
      'In-transit rider dispatch tracking',
      'Delivery receipt confirmation with atomic SQLite stock updates'
    ]
  },
  operations: {
    title: 'Operations Dashboard',
    description: 'Task queue, in-transit transfer tracker & dark store fleet capacity',
    endpoints: ['GET /api/v1/logistics/trucks', 'GET /api/v1/logistics/donors', 'GET /api/v1/logistics/riders'],
    plannedFeatures: [
      'In-store task queue (shelf replenishment alerts, stock receipts)',
      'Transfer tracker (origin donor store, destination, driver ETA, stockout deadline & safety buffer)',
      'Store shelf vs backroom capacity visualizer',
      'Hyper-local rider fleet capacity & shortage monitor',
      'Expedited truck dispatch tracking',
    ],
  },
  store: {
    title: 'Store Details',
    description: 'Dark store overview, physical capacity, and 24-hour demand uplift curves',
    endpoints: ['GET /api/v1/stores/{id}/inventory', 'GET /api/v1/forecast/hourly', 'GET /api/v1/events/context'],
    plannedFeatures: [
      'Store metadata, location zone, and Chinnaswamy Stadium proximity',
      '24-Hour hourly forecast chart with stacked Cricket, Rain, and Festival uplifts',
      'Active external event driver cards (match status, precipitation rate mm/hr)',
      'Complete SKU inventory table with shelf capacity, safety stock, and reorder points',
      'Central warehouse availability & next dispatch window',
    ],
  },
  actions: {
    title: 'Action Log',
    description: 'Complete audit trail of approved, rejected, and executed manager decisions',
    endpoints: ['GET /api/v1/actions/history'],
    plannedFeatures: [
      'Historical audit ledger with pagination & search',
      'Filterable by action type (TRANSFER, EARLIER_TRUCK, SHELF_SWAP)',
      'Financial outcome tracking (cost inr vs revenue saved inr)',
      'Manager ID and timestamp tracking',
      'Rejection reasons & notes inspector',
    ],
  },
  simulation: {
    title: 'What-If Simulation',
    description: 'Scenario sandboxing and dynamic demand multiplier recalculation',
    endpoints: ['POST /api/v1/simulation/recalculate'],
    plannedFeatures: [
      'Dynamic multiplier sliders for Cricket match intensity (1.0x - 4.5x)',
      'Weather simulation slider (Rain precipitation mm/hr)',
      'Rider shortage override slider',
      'Real-time recalculation of demand peak and stockout minutes',
      'Simulated recommendation recalculation without modifying database state',
    ],
  },
}

export function AppShell({
  initialTab = 'manager',
  currentUser = null,
  onLogout = null,
  onSwitchManager = null,
  children,
}) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedStoreId, setSelectedStoreId] = useState(currentUser?.store_id || 'STORE_007')
  const [incomingTransfersCount, setIncomingTransfersCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentMode, setCurrentMode] = useState(getDataSourceMode())

  // Keep selectedStoreId in sync with currentUser
  useEffect(() => {
    if (currentUser?.store_id) {
      setSelectedStoreId(currentUser.store_id)
    }
  }, [currentUser])

  // Periodic poll for incoming transfer requests
  useEffect(() => {
    let active = true
    async function checkIncoming() {
      try {
        const data = await fetchTransfers('incoming')
        if (active) {
          setIncomingTransfersCount(data.pending_incoming_count || 0)
        }
      } catch {
        // Silently ignore if unauthenticated or network error
      }
    }
    checkIncoming()
    const timer = setInterval(checkIncoming, 10000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [currentUser])

  const handleToggleMode = () => {
    const nextMode = currentMode === 'mock' ? 'live' : 'mock'
    setDataSourceMode(nextMode)
    setCurrentMode(nextMode)
  }

  const currentRouteMeta = ROUTE_METADATA[activeTab] || ROUTE_METADATA.manager

  return (
    <div className="min-h-screen bg-[#f7faf9] text-slate-900 flex flex-col font-sans antialiased">
      <div className="flex-1 flex overflow-hidden">
        
        {/* Desktop Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          dataSourceMode={currentMode}
          className="hidden lg:flex"
        />

        {/* Mobile Drawer Backdrop & Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-[#041a18]/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#04201e] z-50">
              <Sidebar
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                dataSourceMode={currentMode}
                onCloseMobile={() => setMobileMenuOpen(false)}
                className="w-full h-full border-r-0"
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header */}
          <Header
            activeTabTitle={currentRouteMeta.title}
            activeTabDescription={currentRouteMeta.description}
            selectedStoreId={selectedStoreId}
            onSelectStore={setSelectedStoreId}
            dataSourceMode={currentMode}
            onToggleDataSourceMode={handleToggleMode}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            alertCount={1}
            currentUser={currentUser}
            incomingTransfersCount={incomingTransfersCount}
            onOpenTransfers={() => setActiveTab('transfers')}
            onLogout={onLogout}
            onSwitchManager={onSwitchManager}
          />

          {/* Page Body Container */}
          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
            
            {/* View Switching: Manager, Transfers, Operations, Store Details, Action Log, and What-if Simulation Dashboards */}
            {activeTab === 'manager' ? (
              <ManagerDashboard selectedStoreId={selectedStoreId} />
            ) : activeTab === 'transfers' ? (
              <StockTransfersDashboard currentUser={currentUser} />
            ) : activeTab === 'operations' ? (
              <OperationsDashboard selectedStoreId={selectedStoreId} />
            ) : activeTab === 'store' ? (
              <StoreDetailsDashboard selectedStoreId={selectedStoreId} onSelectStore={setSelectedStoreId} />
            ) : activeTab === 'actions' ? (
              <ActionLogDashboard selectedStoreId={selectedStoreId} onSelectStore={setSelectedStoreId} />
            ) : activeTab === 'simulation' ? (
              <SimulationDashboard selectedStoreId={selectedStoreId} onSelectStore={setSelectedStoreId} />
            ) : (
              /* Fallback Blueprint Card */
              <Card className="border-teal-100 ring-1 ring-teal-500/10">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <div className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                        Screen Blueprint Placeholder
                      </div>
                      <CardTitle className="text-lg">
                        {currentRouteMeta.title}
                      </CardTitle>
                    </div>
                    <Badge variant="primary" dot={true}>
                      Phase Navigation Placeholder
                    </Badge>
                  </div>
                  <CardDescription>
                    {currentRouteMeta.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Planned Features List */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        Planned Scope for this Screen
                      </div>
                      <ul className="text-xs text-slate-600 space-y-1.5 pl-1">
                        {currentRouteMeta.plannedFeatures.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* API Endpoints Mapping */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-blue-600" />
                        Authoritative Contract Endpoints Mapped
                      </div>
                      <div className="space-y-1.5">
                        {currentRouteMeta.endpoints.map((ep, i) => (
                          <div
                            key={i}
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-700 flex items-center justify-between"
                          >
                            <span>{ep}</span>
                            <span className="text-[10px] text-indigo-600 font-semibold">contracts/api-spec.md</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="bg-slate-50/50">
                  <span className="text-xs text-slate-500">
                    Business logic and data feeds for this screen will be implemented in subsequent phases upon your approval.
                  </span>
                  <span className="text-xs font-semibold text-teal-700 flex items-center gap-1">
                    Manager Dashboard Active <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </CardFooter>
              </Card>
            )}

            {children}
          </main>
        </div>

      </div>
    </div>
  )
}
