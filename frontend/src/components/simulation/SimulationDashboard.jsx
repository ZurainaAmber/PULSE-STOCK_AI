import React, { useState, useEffect, useCallback } from 'react'
import {
  Sliders,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Info,
  ShieldCheck,
  AlertTriangle,
  Server,
  Layers,
} from 'lucide-react'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { ScenarioControlsPanel } from './ScenarioControlsPanel'
import { ComparisonView } from './ComparisonView'
import { SimulatedRecommendationsDeck } from './SimulatedRecommendationsDeck'
import {
  BASELINE_PARAMETERS,
  BASELINE_OUTPUTS,
  executeSimulation,
} from '../../services/simulationService'
import { getDataSourceMode } from '../../api/client'

export function SimulationDashboard({ selectedStoreId = 'STORE_007', onSelectStore }) {
  const [parameters, setParameters] = useState({ ...BASELINE_PARAMETERS })
  const [simulatedResult, setSimulatedResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const mode = getDataSourceMode()

  // Recalculate simulation whenever parameters change or on mount
  const runRecalculation = useCallback(
    async (paramsToRun) => {
      setLoading(true)
      setError(null)
      try {
        const result = await executeSimulation(
          paramsToRun,
          selectedStoreId,
          'SKU_COLD_DRINK_750ML'
        )
        setSimulatedResult(result)
      } catch (err) {
        console.error('[SimulationDashboard] Error executing simulation:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    },
    [selectedStoreId]
  )

  useEffect(() => {
    runRecalculation(parameters)
  }, [runRecalculation, parameters, mode])

  // Handle single parameter change
  const handleChangeParameter = (key, value) => {
    const next = { ...parameters, [key]: value }
    setParameters(next)
  }

  // Handle preset scenario application
  const handleApplyPreset = (presetParams) => {
    const next = { ...BASELINE_PARAMETERS, ...presetParams }
    setParameters(next)
  }

  // Handle reset to baseline
  const handleResetToBaseline = () => {
    setParameters({ ...BASELINE_PARAMETERS })
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              What-if Scenario Simulation Sandbox
            </h2>
            <Badge variant={mode === 'live' ? 'success' : 'neutral'} dot={true}>
              {mode === 'live' ? 'Live API Sandbox' : 'Deterministic Mock Engine'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate speculative demand surges, courier shortages, and route friction without mutating database state.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runRecalculation(parameters)}
            disabled={loading}
            className="text-xs gap-1.5 h-8 text-slate-700 hover:text-teal-700 bg-white hover:bg-teal-50/50 border-slate-200/80"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
            Recalculate Scenario
          </Button>
        </div>
      </div>

      {/* Engine Provenance & Stub Disclosure Notice */}
      {mode === 'live' ? (
        simulatedResult?.is_backend_stub ? (
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <Server className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-amber-950">Live Backend Stub Notice (POST /api/v1/simulation/recalculate):</span>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                The live FastAPI backend endpoint was invoked successfully (Simulation ID:{' '}
                <code className="font-mono bg-amber-100/70 text-amber-950 px-1 py-0.5 rounded text-[10px]">
                  {simulatedResult.simulation_id}
                </code>
                ), but its current handler returns an empty recommendations list and does not compute recalculated demand/stockout metrics. Per contract integrity rules, an illustrative client-side preview based on{' '}
                <code className="font-mono bg-amber-100/70 text-amber-950 px-1 py-0.5 rounded text-[10px]">contracts/engine-interface.md</code> is shown alongside for evaluation.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/80 text-teal-950 flex items-start gap-2.5">
            <Server className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
            <div className="text-xs space-y-0.5">
              <span className="font-semibold text-teal-900">Live Simulation Engine Connected:</span>
              <p className="text-teal-800 leading-relaxed text-[11px]">
                Dynamic parameters processed directly by POST /api/v1/simulation/recalculate without database mutation.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 text-slate-800 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-slate-900">Deterministic Mock Engine Active:</span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Calculations strictly implement <code className="bg-slate-200/60 px-1 py-0.5 rounded text-[10px] font-mono">contracts/engine-interface.md Section 4</code>:
              Rule 1 (4.5x cap on multiplicative demand), Rule 2 (Shelf/Backroom depletion against 55 units stock), and Rule 3 (Rider shortage &lt; 2 riders adds +25m delay and promotes Earlier Truck to #1).
            </p>
          </div>
        </div>
      )}

      {/* Error Card */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            Failed to Execute Live Simulation Endpoint
          </div>
          <p className="text-xs text-rose-700">
            {error.message || 'Error communicating with POST /api/v1/simulation/recalculate.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runRecalculation(parameters)}
            className="text-xs border-rose-300 text-rose-700"
          >
            Retry Simulation
          </Button>
        </div>
      )}

      {/* 1. Parameter Overrides Control Deck */}
      <ScenarioControlsPanel
        parameters={parameters}
        onChangeParameter={handleChangeParameter}
        onResetToBaseline={handleResetToBaseline}
        onApplyPreset={handleApplyPreset}
        isRecalculating={loading}
      />

      {/* 2. Side-by-Side Baseline vs Scenario Comparison */}
      <ComparisonView
        simulatedResult={simulatedResult}
        parameters={parameters}
      />

      {/* 3. Recalculated Resolution Strategy Rankings Deck */}
      <SimulatedRecommendationsDeck
        recommendations={simulatedResult?.simulated_recommendations || []}
        baselineRecommendations={BASELINE_OUTPUTS.recommendations}
        source={simulatedResult?.source || mode}
        isBackendStub={Boolean(simulatedResult?.is_backend_stub)}
        isMalformed={Boolean(simulatedResult?.is_malformed)}
      />
    </div>
  )
}
