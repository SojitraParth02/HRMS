"use client";

import React from "react";
import { CalendarTodayIcon, RestartAltIcon } from "../../icons";

interface DashboardFilterBarProps {
  selectedDate: string;
  selectedMonthYear: string;
  onDateChange: (date: string) => void;
  onMonthYearChange: (monthYear: string) => void;
  onReset: () => void;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  selectedDate,
  selectedMonthYear,
  onDateChange,
  onMonthYearChange,
  onReset,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Page Title & Subtitle */}
      <div>
        <div className="inline-block relative">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <div className="w-8 h-[3px] bg-[#10b981] rounded-full mt-0.5" />
        </div>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Real-time executive overview of workforce operations
        </p>
      </div>

      {/* Reactive Filter Strip */}
      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
        {/* Attendance Date Filter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-2xs">
          <label className="text-[10px] uppercase font-bold text-slate-400">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                onDateChange(val);
                // Also align month if date changes to a different month
                const monthPart = val.slice(0, 7);
                if (monthPart !== selectedMonthYear) {
                  onMonthYearChange(monthPart);
                }
              }
            }}
            className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          />
        </div>

        {/* Payroll & OT Month Filter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-2xs">
          <CalendarTodayIcon className="w-3.5 h-3.5 text-teal-700" />
          <label className="text-[10px] uppercase font-bold text-slate-400">Cycle:</label>
          <input
            type="month"
            value={selectedMonthYear}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                onMonthYearChange(val);
              }
            }}
            className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          />
        </div>

        {/* Reset to Current Date Button */}
        <button
          type="button"
          onClick={onReset}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition shadow-2xs cursor-pointer flex items-center justify-center"
          title="Reset to Today"
        >
          <RestartAltIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
