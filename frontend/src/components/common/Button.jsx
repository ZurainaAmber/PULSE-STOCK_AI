import React from 'react'
import clsx from 'clsx'

const VARIANT_STYLES = {
  primary: 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm shadow-teal-900/15 active:bg-teal-900 focus-visible:ring-teal-500',
  mint: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-700/20 active:bg-emerald-800 focus-visible:ring-emerald-500',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs active:bg-slate-100 focus-visible:ring-slate-400',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200 active:bg-rose-800 focus-visible:ring-rose-500',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 active:bg-slate-200 focus-visible:ring-slate-400',
  outline: 'bg-transparent hover:bg-teal-50/70 text-teal-800 border border-teal-200 active:bg-teal-100 focus-visible:ring-teal-400',
}

const SIZE_STYLES = {
  sm: 'px-2.5 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-3.5 py-2 text-sm font-semibold rounded-xl gap-2',
  lg: 'px-4.5 py-2.5 text-base font-semibold rounded-xl gap-2.5',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-all duration-150 select-none cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        VARIANT_STYLES[variant] || VARIANT_STYLES.primary,
        SIZE_STYLES[size] || SIZE_STYLES.md,
        isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none shadow-none',
        className
      )}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : Icon && iconPosition === 'left' ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}

      <span>{children}</span>

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  )
}
