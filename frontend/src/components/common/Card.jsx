import React from 'react'
import clsx from 'clsx'

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={clsx(
        'bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_0_rgba(15,23,42,0.04),0_1px_2px_-1px_rgba(15,23,42,0.02)] transition-all duration-200',
        hover && 'hover:shadow-md hover:border-slate-300/90',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={clsx('p-5 pb-3 flex flex-col space-y-1.5', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '', as: Component = 'h3', ...props }) {
  return (
    <Component
      className={clsx('font-bold text-slate-900 text-base tracking-tight', className)}
      {...props}
    >
      {children}
    </Component>
  )
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p
      className={clsx('text-xs text-slate-500 font-normal leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  )
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={clsx('p-5 pt-2', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={clsx(
        'p-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
