"use client";

import React from "react";
import Link from "next/link";
import {
  AccessTimeIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowForwardIcon,
} from "../../icons";
import { OvertimeMetrics } from "../../../types/dashboard.types";

interface OvertimeHistogramCardProps {
  overtime: OvertimeMetrics;
}

export const OvertimeHistogramCard: React.FC<OvertimeHistogramCardProps> = ({
  overtime,
}) => {
  const { totalApprovedHours, otTrendPct, departmentDistribution } = overtime;

  const isPositive = otTrendPct >= 0;
  const TrendIcon = isPositive ? TrendingUpIcon : TrendingDownIcon;
  const trendColor = isPositive ? "text-emerald-600" : "text-rose-600";
  const trendPrefix = isPositive ? "+" : "";

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-teal-50 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <AccessTimeIcon className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-800">
              Overtime Summary
            </h2>
          </div>
          <Link
            href="/payroll"
            className="text-[11px] font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
          >
            <span>Overtime Log</span>
            <ArrowForwardIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {totalApprovedHours} hrs
          </span>
          <span className={`text-[11px] font-bold inline-flex items-center gap-0.5 ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{trendPrefix}{otTrendPct}%</span>
          </span>
        </div>
      </div>

      {/* Dynamic Overtime Histogram Bars */}
      <div className="mt-3">
        <div className="flex items-end justify-between gap-1.5 h-16 pt-3 px-1">
          {departmentDistribution.length === 0 ? (
            <div className="w-full text-center text-[11px] text-slate-400 py-3">
              No approved overtime logged
            </div>
          ) : (
            departmentDistribution.map((item, idx) => {
              const height = Math.min(100, Math.max(8, item.percentage));
              // Dynamic teal gradient tinting
              const opacityClass =
                idx === departmentDistribution.length - 1
                  ? "bg-teal-700"
                  : idx >= departmentDistribution.length - 3
                  ? "bg-teal-500"
                  : "bg-teal-300";

              return (
                <div
                  key={`${item.label}-${idx}`}
                  className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                >
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                    {item.label}: {item.hours}h
                  </div>

                  {/* Histogram Bar */}
                  <div
                    style={{ height: `${height}%` }}
                    className={`w-full max-w-[18px] rounded-t-sm transition-all duration-500 hover:brightness-110 ${opacityClass}`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Department / Category Labels */}
        <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400 px-1 pt-1.5 border-t border-slate-100">
          {departmentDistribution.slice(0, 4).map((d) => (
            <span key={d.label} className="truncate max-w-[55px]" title={d.label}>
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
