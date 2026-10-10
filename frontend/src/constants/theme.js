/**
 * PulseStock AI - Visual Theme & Design Tokens
 * 
 * Inspired by TeamHub clean retail operations design:
 * Soft light-grey backgrounds, white cards, subtle borders, refined typography,
 * indigo/purple primary actions, and semantic status indicators (green/red/blue/amber).
 */

import { ALERT_SEVERITY, OPTION_TYPE, ACTION_STATUS } from './contracts';

export const SEVERITY_THEME = {
  [ALERT_SEVERITY.CRITICAL]: {
    label: 'Critical (<60m)',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200 ring-1 ring-rose-600/10',
    dotClass: 'bg-rose-500 ring-rose-200',
    borderClass: 'border-l-4 border-l-rose-500',
    textClass: 'text-rose-700',
    bgLight: 'bg-rose-50',
  },
  [ALERT_SEVERITY.HIGH]: {
    label: 'High (<120m)',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200 ring-1 ring-amber-600/10',
    dotClass: 'bg-amber-500 ring-amber-200',
    borderClass: 'border-l-4 border-l-amber-500',
    textClass: 'text-amber-800',
    bgLight: 'bg-amber-50',
  },
  [ALERT_SEVERITY.MEDIUM]: {
    label: 'Medium (<240m)',
    badgeClass: 'bg-yellow-50 text-yellow-800 border border-yellow-200 ring-1 ring-yellow-600/10',
    dotClass: 'bg-yellow-500 ring-yellow-200',
    borderClass: 'border-l-4 border-l-yellow-500',
    textClass: 'text-yellow-800',
    bgLight: 'bg-yellow-50',
  },
  [ALERT_SEVERITY.LOW]: {
    label: 'Low (>4h Safe)',
    badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 ring-1 ring-emerald-600/10',
    dotClass: 'bg-emerald-500 ring-emerald-200',
    borderClass: 'border-l-4 border-l-emerald-500',
    textClass: 'text-emerald-800',
    bgLight: 'bg-emerald-50',
  },
};

export const OPTION_THEME = {
  [OPTION_TYPE.TRANSFER]: {
    title: 'Inter-Store Transfer',
    tag: 'Donor Store Rider',
    badgeClass: 'bg-teal-50 text-teal-800 border border-teal-200 ring-1 ring-teal-600/10',
    accentBorder: 'border-teal-600',
    buttonClass: 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm shadow-teal-700/20',
    colorHex: '#0f766e',
  },
  [OPTION_TYPE.EARLIER_TRUCK]: {
    title: 'Expedited Truck',
    tag: 'Central Warehouse Express',
    badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200 ring-1 ring-sky-600/10',
    accentBorder: 'border-sky-600',
    buttonClass: 'bg-sky-700 hover:bg-sky-800 text-white shadow-sm shadow-sky-700/20',
    colorHex: '#0369a1',
  },
  [OPTION_TYPE.SHELF_SWAP]: {
    title: 'Shelf Space Swap',
    tag: 'Internal Reallocation',
    badgeClass: 'bg-purple-50 text-purple-800 border border-purple-200 ring-1 ring-purple-600/10',
    accentBorder: 'border-purple-600',
    buttonClass: 'bg-purple-700 hover:bg-purple-800 text-white shadow-sm shadow-purple-700/20',
    colorHex: '#7e22ce',
  },
  [OPTION_TYPE.WAIT]: {
    title: 'Wait for Scheduled Delivery',
    tag: 'Passive Buffer',
    badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200 ring-1 ring-slate-600/10',
    accentBorder: 'border-slate-400',
    buttonClass: 'bg-slate-700 hover:bg-slate-800 text-white shadow-sm shadow-slate-200',
    colorHex: '#475569',
  },
};

export const ACTION_STATUS_THEME = {
  [ACTION_STATUS.APPROVED]: {
    label: 'Approved',
    badgeClass: 'bg-teal-50 text-teal-800 border border-teal-200',
    dotClass: 'bg-teal-600',
  },
  [ACTION_STATUS.REJECTED]: {
    label: 'Rejected',
    badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
    dotClass: 'bg-rose-500',
  },
  [ACTION_STATUS.EXECUTED]: {
    label: 'Executed',
    badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
};
