"use client";

import React from "react";
import { DownloadIcon, SearchIcon, FilterListIcon } from "../icons";

interface ReportFilterBarProps {
  mode: "dateRange" | "monthYear";
  // Date Range Mode
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (val: string) => void;
  onEndDateChange?: (val: string) => void;
  // Month-Year Mode
  monthYear?: string;
  onMonthYearChange?: (val: string) => void;
  // Common Department & Search
  department: string;
  onDepartmentChange: (val: string) => void;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  // Actions
  onExportCsv: () => void;
  isExportDisabled?: boolean;
  totalRecordsCount?: number;
}

export const ReportFilterBar: React.FC<ReportFilterBarProps> = ({
  mode,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  monthYear,
  onMonthYearChange,
  department,
  onDepartmentChange,
  searchQuery,
  onSearchQueryChange,
  onExportCsv,
  isExportDisabled = false,
  totalRecordsCount,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-teal-50 shadow-2xs space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {mode === "dateRange" ? (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate || ""}
                  onChange={(e) => onStartDateChange?.(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate || ""}
                  onChange={(e) => onEndDateChange?.(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Billing Cycle (Month-Year)
              </label>
              <input
                type="month"
                value={monthYear || ""}
                onChange={(e) => onMonthYearChange?.(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer font-mono"
              />
            </div>
          )}

          {/* Department Filter Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Department
            </label>
            <div className="relative">
              <select
                value={department}
                onChange={(e) => onDepartmentChange(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer min-w-40 appearance-none pr-8"
              >
                <option value="">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="Finance">Finance</option>
                <option value="Administration">Administration</option>
              </select>
              <FilterListIcon className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right: Search & Export Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative w-full sm:w-60">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search employee..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>

          {/* Export to CSV Button */}
          <button
            type="button"
            onClick={onExportCsv}
            disabled={isExportDisabled}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:cursor-not-allowed shrink-0"
            title="Download CSV spreadsheet"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Export to CSV</span>
            {typeof totalRecordsCount === "number" && totalRecordsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-teal-800/60 rounded-full text-[10px]">
                {totalRecordsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
