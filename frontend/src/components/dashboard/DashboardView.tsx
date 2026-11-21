"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useDashboardStatsQuery } from "../../hooks/queries/useDashboardStats";
import { DashboardFilterBar } from "./widgets/DashboardFilterBar";
import { ActionQueueBanner } from "./widgets/ActionQueueBanner";
import { KpiMetricsGrid } from "./widgets/KpiMetricsGrid";
import { AttendanceDonutChart } from "./widgets/AttendanceDonutChart";
import { PayrollWaveCard } from "./widgets/PayrollWaveCard";
import { OvertimeHistogramCard } from "./widgets/OvertimeHistogramCard";
import { PayrollStatusCard } from "./widgets/PayrollStatusCard";
import {
  CancelIcon,
  RestartAltIcon,
  CheckCircleIcon,
  ArrowForwardIcon,
  CalendarTodayIcon,
  PaymentsIcon,
  GroupIcon,
} from "../icons";

export const DashboardView: React.FC = () => {
  const getTodayDate = () => new Date().toISOString().slice(0, 10);
  const getCurrentMonthYear = () => new Date().toISOString().slice(0, 7);

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(getCurrentMonthYear);

  const handleReset = () => {
    setSelectedDate(getTodayDate());
    setSelectedMonthYear(getCurrentMonthYear());
  };

  const { data, isLoading, isError, refetch } = useDashboardStatsQuery({
    monthYear: selectedMonthYear,
    date: selectedDate,
  });

  return (
    <div className="px-4 sm:px-8 py-5 flex-1 space-y-5">
      {/* 1. Header Filter Bar */}
      <DashboardFilterBar
        selectedDate={selectedDate}
        selectedMonthYear={selectedMonthYear}
        onDateChange={setSelectedDate}
        onMonthYearChange={setSelectedMonthYear}
        onReset={handleReset}
      />

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-slate-100 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : isError || !data ? (
        /* Error State */
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3">
          <CancelIcon className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-sm font-bold text-slate-800">
            Failed to Load Live Dashboard Metrics
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Unable to connect to the backend aggregation engine. Please check your network or session credentials.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RestartAltIcon className="w-4 h-4" />
            <span>Retry Query</span>
          </button>
        </div>
      ) : (
        /* Dynamic Live Data Pipeline Render */
        <>
          {/* 2. Managerial Action Queue Banner */}
          <ActionQueueBanner actionQueue={data.actionQueue} />

          {/* 3. Primary KPI Metrics Grid */}
          <KpiMetricsGrid kpis={data.kpis} />

          {/* 4. Detailed Visual Summaries Grid (Attendance Donut, Payroll Wave, Overtime Histogram) */}
          <section
            aria-label="Detailed Operational Summaries"
            className="grid grid-cols-1 lg:grid-cols-3 gap-3.5"
          >
            <AttendanceDonutChart attendance={data.attendance} />
            <PayrollWaveCard payroll={data.payroll} />
            <OvertimeHistogramCard overtime={data.overtime} />
          </section>

          {/* 5. Bottom Payroll Status & Executive Quick Access Grid */}
          <section
            aria-label="Status and Quick Access"
            className="grid grid-cols-1 lg:grid-cols-12 gap-3.5"
          >
            {/* Payroll Status Card (8 cols) */}
            <div className="lg:col-span-7">
              <PayrollStatusCard payroll={data.payroll} />
            </div>

            {/* Workplace Quick Launch Card (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-5 text-white shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-teal-300">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Executive Portal
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-2 tracking-tight">
                  Smarter HR. A Better Workplace.
                </h3>
                <p className="text-xs text-teal-100/80 font-normal mt-1 leading-relaxed">
                  Real-time workforce attendance, biometric reconciliation, and compliant statutory 26-day payroll engine.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-teal-700/60">
                <Link
                  href="/employees"
                  className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl text-center transition group cursor-pointer"
                >
                  <GroupIcon className="w-4 h-4 mx-auto text-teal-300 group-hover:scale-110 transition-transform" />
                  <span className="block text-[10px] font-bold text-white mt-1">Staff</span>
                </Link>

                <Link
                  href="/attendance"
                  className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl text-center transition group cursor-pointer"
                >
                  <CalendarTodayIcon className="w-4 h-4 mx-auto text-teal-300 group-hover:scale-110 transition-transform" />
                  <span className="block text-[10px] font-bold text-white mt-1">Roster</span>
                </Link>

                <Link
                  href="/payroll"
                  className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl text-center transition group cursor-pointer"
                >
                  <PaymentsIcon className="w-4 h-4 mx-auto text-teal-300 group-hover:scale-110 transition-transform" />
                  <span className="block text-[10px] font-bold text-white mt-1">Payroll</span>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default DashboardView;
