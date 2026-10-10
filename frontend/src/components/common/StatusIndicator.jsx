import React from 'react'
import clsx from 'clsx'

const STATUS_CONFIGS = {
  live: {
    dotColor: 'bg-emerald-500',
    pingColor: 'bg-emerald-400',
    textColor: 'text-emerald-700',
    defaultLabel: 'Live API',
  },
  mock: {
    dotColor: 'bg-teal-600',
    pingColor: 'bg-teal-400',
    textColor: 'text-teal-800',
    defaultLabel: 'Mock Data Mode',
  },
  healthy: {
    dotColor: 'bg-emerald-500',
    pingColor: 'bg-emerald-400',
    textColor: 'text-emerald-700',
    defaultLabel: 'Healthy',
  },
  critical: {
    dotColor: 'bg-red-500',
    pingColor: 'bg-red-400',
    textColor: 'text-red-700',
    defaultLabel: 'Critical Alert',
  },
  warning: {
    dotColor: 'bg-amber-500',
    pingColor: 'bg-amber-400',
    textColor: 'text-amber-700',
    defaultLabel: 'Warning',
  },
  offline: {
    dotColor: 'bg-slate-400',
    pingColor: null,
    textColor: 'text-slate-500',
    defaultLabel: 'Offline',
  },
}

export function StatusIndicator({
  status = 'mock',
  label = null,
  pulse = true,
  className = '',
}) {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.mock
  const displayLabel = label ?? config.defaultLabel

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 text-xs font-medium select-none',
        config.textColor,
        className
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {pulse && config.pingColor && (
          <span
            className={clsx(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              config.pingColor
            )}
          />
        )}
        <span
          className={clsx('relative inline-flex rounded-full h-2 w-2', config.dotColor)}
        />
      </span>
      <span>{displayLabel}</span>
    </div>
  )
}
