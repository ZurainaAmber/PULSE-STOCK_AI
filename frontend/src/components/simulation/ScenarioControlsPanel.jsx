import React from 'react'
import {
  Sliders,
  RotateCcw,
  Sparkles,
  Zap,
  CloudRain,
  Users,
  Clock,
  Package,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { BASELINE_PARAMETERS } from '../../services/simulationService'

export function ScenarioControlsPanel({
  parameters,
  onChangeParameter,
  onResetToBaseline,
  onApplyPreset,
  isRecalculating,
}) {
  // Check which parameters have been modified from baseline
  const modifiedKeys = Object.keys(BASELINE_PARAMETERS).filter(
    (k) => parameters[k] !== BASELINE_PARAMETERS[k]
  )
  const isModified = modifiedKeys.length > 0

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-6">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-700" />
              What-if Scenario Control Deck
            </h3>
            {isModified && (
              <Badge variant="warning" size="sm">
                {modifiedKeys.length} Override{modifiedKeys.length > 1 ? 's' : ''} Active
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Adjust demand triggers, courier staffing, and logistics friction without mutating database state.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {isModified && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetToBaseline}
              className="text-xs text-slate-600 border-slate-200 hover:bg-slate-50 h-8 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Baseline
            </Button>
          )}
        </div>
      </div>

      {/* Preset Scenarios Quick Bar */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-teal-600" />
          Contract Preset Scenarios
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() =>
              onApplyPreset({
                cricket_match_multiplier: 2.5,
                rain_intensity_mm_hr: 35.0,
                available_riders: 1,
                custom_transfer_quantity_units: 75,
                delivery_delay_minutes: 0,
                transfer_blocked: false,
              })
            }
            className="p-2.5 rounded-xl border border-slate-200/90 hover:border-teal-300 hover:bg-teal-50/50 text-left transition-all cursor-pointer group"
          >
            <div className="text-xs font-semibold text-slate-800 group-hover:text-teal-800">
              🌧️ Downpour & Shortage
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Rain 35mm, 1 rider (Rule 3)
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              onApplyPreset({
                cricket_match_multiplier: 4.0,
                rain_intensity_mm_hr: 0.0,
                available_riders: 4,
                custom_transfer_quantity_units: 90,
                delivery_delay_minutes: 0,
                transfer_blocked: false,
              })
            }
            className="p-2.5 rounded-xl border border-slate-200/90 hover:border-teal-300 hover:bg-teal-50/50 text-left transition-all cursor-pointer group"
          >
            <div className="text-xs font-semibold text-slate-800 group-hover:text-teal-800">
              🏏 Match Super-Spike
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Cricket 4.0x, high volume
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              onApplyPreset({
                cricket_match_multiplier: 2.5,
                rain_intensity_mm_hr: 45.0,
                available_riders: 0,
                custom_transfer_quantity_units: 60,
                delivery_delay_minutes: 30,
                transfer_blocked: true,
              })
            }
            className="p-2.5 rounded-xl border border-slate-200/90 hover:border-teal-300 hover:bg-teal-50/50 text-left transition-all cursor-pointer group"
          >
            <div className="text-xs font-semibold text-slate-800 group-hover:text-teal-800">
              🚫 Corridor Blockage
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Transfer blocked, 0 riders
            </div>
          </button>

          <button
            type="button"
            onClick={onResetToBaseline}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-all cursor-pointer"
          >
            <div className="text-xs font-semibold text-slate-700">
              ⚙️ Default Baseline
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Store 7 active production
            </div>
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
        {/* Slider 1: Cricket Match Multiplier */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Cricket Match Uplift
            </span>
            <span className="font-mono font-bold text-teal-800">
              {parameters.cricket_match_multiplier}x
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="4.5"
            step="0.1"
            value={parameters.cricket_match_multiplier}
            onChange={(e) =>
              onChangeParameter('cricket_match_multiplier', parseFloat(e.target.value))
            }
            className="w-full accent-teal-700 cursor-pointer"
            aria-label="Cricket Match Multiplier"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>1.0x (No Match)</span>
            <span className="text-slate-500 font-medium">Base: 2.5x</span>
            <span>4.5x (Peak Innings)</span>
          </div>
        </div>

        {/* Slider 2: Rain Precipitation Intensity */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-sky-500" />
              Rain Precipitation
            </span>
            <span className="font-mono font-bold text-teal-800">
              {parameters.rain_intensity_mm_hr} mm/hr
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="2.5"
            value={parameters.rain_intensity_mm_hr}
            onChange={(e) =>
              onChangeParameter('rain_intensity_mm_hr', parseFloat(e.target.value))
            }
            className="w-full accent-teal-700 cursor-pointer"
            aria-label="Rain Precipitation mm/hr"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0 mm (Dry)</span>
            <span className="text-slate-500 font-medium">Base: 22.5 mm</span>
            <span>50 mm (Flood)</span>
          </div>
        </div>

        {/* Slider 3: Available Hyper-local Riders */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-500" />
              Available Riders
            </span>
            <span className={`font-mono font-bold ${parameters.available_riders < 2 ? 'text-rose-600' : 'text-teal-800'}`}>
              {parameters.available_riders} rider{parameters.available_riders === 1 ? '' : 's'}
              {parameters.available_riders < 2 && ' (Shortage!)'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={parameters.available_riders}
            onChange={(e) =>
              onChangeParameter('available_riders', parseInt(e.target.value, 10))
            }
            className="w-full accent-teal-700 cursor-pointer"
            aria-label="Available Riders"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span className="text-rose-500">0 (Halted)</span>
            <span className="text-slate-500 font-medium">Base: 3</span>
            <span>10 (Full Fleet)</span>
          </div>
        </div>

        {/* Slider 4: Transfer Transit Friction / Delay */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Transit Delay Friction
            </span>
            <span className="font-mono font-bold text-teal-800">
              +{parameters.delivery_delay_minutes} mins
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={parameters.delivery_delay_minutes}
            onChange={(e) =>
              onChangeParameter('delivery_delay_minutes', parseInt(e.target.value, 10))
            }
            className="w-full accent-teal-700 cursor-pointer"
            aria-label="Delivery Delay Minutes"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0m (Normal)</span>
            <span className="text-slate-500 font-medium">Base: 0m</span>
            <span>+60m (Gridlock)</span>
          </div>
        </div>

        {/* Slider 5: Custom Transfer Quantity */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-teal-700" />
              Transfer Batch Size
            </span>
            <span className="font-mono font-bold text-teal-800">
              {parameters.custom_transfer_quantity_units} units
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="150"
            step="5"
            value={parameters.custom_transfer_quantity_units}
            onChange={(e) =>
              onChangeParameter('custom_transfer_quantity_units', parseInt(e.target.value, 10))
            }
            className="w-full accent-teal-700 cursor-pointer"
            aria-label="Custom Transfer Quantity Units"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>20 units</span>
            <span className="text-slate-500 font-medium">Base: 60 units</span>
            <span>150 units (Max)</span>
          </div>
        </div>

        {/* Toggle 6: Transit Corridor Blockage */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-0.5 pr-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              Corridor Blockage
            </span>
            <p className="text-[10px] text-slate-500">
              Simulate waterlogging or complete road closure from Store 3.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={Boolean(parameters.transfer_blocked)}
              onChange={(e) => onChangeParameter('transfer_blocked', e.target.checked)}
              className="sr-only peer"
              aria-label="Toggle Corridor Blockage"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
          </label>
        </div>
      </div>
    </div>
  )
}
