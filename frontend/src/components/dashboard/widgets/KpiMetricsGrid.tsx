"use client";

import React from "react";
import {
  GroupIcon,
  CheckCircleIcon,
  CancelIcon,
  AccessTimeIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "../../icons";
import { DashboardKpis } from "../../../types/dashboard.types";

interface KpiMetricsGridProps {
  kpis: DashboardKpis;
}

export const KpiMetricsGrid: React.FC<KpiMetricsGridProps> = ({ kpis }) => {
  const renderTrendBadge = (trend: number, invertGood: boolean = false) => {
    const isZero = trend === 0;
    const isPositive = trend > 0;
    const isGood = invertGood ? !isPositive : isPositive;

    const textColor = isZero
      ? "text-slate-500"
      : isGood
      ? "text-emerald-600"
      : "text-rose-600";

    const Icon = isPositive ? TrendingUpIcon : TrendingDownIcon;
    const prefix = isPositive ? "+" : "";

    return (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${textColor}`}>
        {!isZero && <Icon className="w-3.5 h-3.5 shrink-0" />}
        <span>{isZero ? "0%" : `${prefix}${trend}%`}</span>
      </span>
    );
  };

  return (
    <section aria-label="KPI Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Total Active Workforce */}
      <div className="bg-white rounded-2xl p-4 border border-teal-50 shadow-2xs relative overflow-hidden flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-[#ccf2ed] flex items-center justify-center shrink-0">
          <GroupIcon className="w-5 h-5 text-[#008272]" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Total Employees</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-800">{kpis.totalEmployees}</span>
            {renderTrendBadge(kpis.headcountTrend)}
          </div>
        </div>
        <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-teal-50/60 rounded-full pointer-events-none" />
      </div>

      {/* 2. Present Employees */}
      <div className="bg-white rounded-2xl p-4 border border-teal-50 shadow-2xs relative overflow-hidden flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-[#d0f5e7] flex items-center justify-center shrink-0">
          <CheckCircleIcon className="w-5 h-5 text-[#059669]" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Present Employees</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-800">{kpis.presentToday}</span>
            {renderTrendBadge(kpis.presentTrend)}
          </div>
        </div>
        <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-emerald-50/60 rounded-full pointer-events-none" />
      </div>

      {/* 3. Absent Employees */}
      <div className="bg-white rounded-2xl p-4 border border-rose-50 shadow-2xs relative overflow-hidden flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-[#ffe4e3] flex items-center justify-center shrink-0">
          <CancelIcon className="w-5 h-5 text-[#ef4444]" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Absent Employees</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-800">{kpis.absentToday}</span>
            {renderTrendBadge(kpis.absentTrend, true)}
          </div>
        </div>
        <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-rose-50/60 rounded-full pointer-events-none" />
      </div>

      {/* 4. Late Employees */}
      <div className="bg-white rounded-2xl p-4 border border-purple-50 shadow-2xs relative overflow-hidden flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-[#ede9fe] flex items-center justify-center shrink-0">
          <AccessTimeIcon className="w-5 h-5 text-[#7c3aed]" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">Late Arrivals</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-800">{kpis.lateToday}</span>
            {renderTrendBadge(kpis.lateTrend, true)}
          </div>
        </div>
        <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-purple-50/60 rounded-full pointer-events-none" />
      </div>
    </section>
  );
};
