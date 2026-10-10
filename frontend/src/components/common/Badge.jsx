import React from 'react'
import clsx from 'clsx'

const VARIANT_MAP = {
  primary: 'bg-teal-50 text-teal-800 border-teal-200 ring-teal-600/10',
  mint: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-600/10',
  critical: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10',
  danger: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10',
  warning: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/10',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-600/10',
  info: 'bg-sky-50 text-sky-800 border-sky-200 ring-sky-600/10',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/10',
  purple: 'bg-purple-50 text-purple-800 border-purple-200 ring-purple-600/10',
}

const DOT_COLOR_MAP = {
  primary: 'bg-teal-600',
  mint: 'bg-emerald-500',
  critical: 'bg-rose-500',
  danger: 'bg-rose-500',
  warning: 'bg-amber-500',
  success: 'bg-emerald-500',
  info: 'bg-sky-500',
  neutral: 'bg-slate-400',
  purple: 'bg-purple-500',
}

export function Badge({
  children,
  variant = 'neutral',
  dot = false,
  dotPulse = false,
  icon: Icon,
  size = 'md',
  className = '',
}) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border ring-1 gap-1.5 shrink-0',
        sizeClasses,
        VARIANT_MAP[variant] || VARIANT_MAP.neutral,
        className
      )}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {dotPulse && (
            <span
              className={clsx(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                DOT_COLOR_MAP[variant] || 'bg-slate-400'
              )}
            />
          )}
          <span
            className={clsx(
              'relative inline-flex rounded-full h-2 w-2',
              DOT_COLOR_MAP[variant] || 'bg-slate-400'
            )}
          />
        </span>
      )}

      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}

      <span>{children}</span>
    </span>
  )
}
