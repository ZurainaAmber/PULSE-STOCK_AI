import React from 'react'
import {
  Search,
  X,
  Filter,
  RotateCcw,
  ArrowUpDown,
  Building2,
  Tag,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'

export function ActionHistoryFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  storeFilter,
  onStoreChange,
  timeHorizon,
  onTimeHorizonChange,
  sortDirection,
  onToggleSortDirection,
  totalRecords,
  filteredCount,
  onResetFilters,
  hasActiveFilters,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
      {/* Top Bar: Search Input & Match Counter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by Action ID, Alert ID, Store, SKU, Manager ID, or Notes..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            aria-label="Search action records"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Counter and Reset Action */}
        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-semibold text-slate-800">{filteredCount}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalRecords}</span> records
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="text-xs text-teal-700 border-teal-200 hover:bg-teal-50 h-8 px-2.5 gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Filter Selectors Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-slate-400" />
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600"
            aria-label="Filter by action status"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved (Authorized)</option>
            <option value="EXECUTED">Executed (Confirmed)</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Action Type Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Tag className="w-3 h-3 text-slate-400" />
            Action Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600"
            aria-label="Filter by action type"
          >
            <option value="ALL">All Types</option>
            <option value="TRANSFER">Inter-Store Transfer</option>
            <option value="EARLIER_TRUCK">Expedited Truck</option>
            <option value="SHELF_SWAP">Shelf Space Swap</option>
            <option value="WAIT">Scheduled Batch Wait</option>
          </select>
        </div>

        {/* Store Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-400" />
            Store
          </label>
          <select
            value={storeFilter}
            onChange={(e) => onStoreChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600"
            aria-label="Filter by store"
          >
            <option value="ALL">All Stores</option>
            <option value="STORE_007">Store 7 (Koramangala)</option>
            <option value="STORE_003">Store 3 (Indiranagar)</option>
            <option value="STORE_012">Store 12 (HSR Layout)</option>
          </select>
        </div>

        {/* Time Horizon Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            Date / Horizon
          </label>
          <select
            value={timeHorizon}
            onChange={(e) => onTimeHorizonChange(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600"
            aria-label="Filter by time horizon"
          >
            <option value="ALL">All Recorded Dates</option>
            <option value="1H">Past 1 Hour</option>
            <option value="6H">Past 6 Hours</option>
            <option value="24H">Past 24 Hours</option>
          </select>
        </div>

        {/* Sort Direction Toggle */}
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            Timestamp Order
          </label>
          <button
            type="button"
            onClick={onToggleSortDirection}
            className="w-full text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
            aria-label={`Sort by timestamp, currently ${sortDirection === 'desc' ? 'newest first' : 'oldest first'}`}
          >
            <span>{sortDirection === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            <span className="text-slate-400 font-semibold">{sortDirection === 'desc' ? '↓' : '↑'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
