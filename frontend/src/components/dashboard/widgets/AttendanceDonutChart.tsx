"use client";

import React from "react";
import Link from "next/link";
import { CalendarTodayIcon, ArrowForwardIcon } from "../../icons";
import { AttendanceBreakdown } from "../../../types/dashboard.types";

interface AttendanceDonutChartProps {
  attendance: AttendanceBreakdown;
}

export const AttendanceDonutChart: React.FC<AttendanceDonutChartProps> = ({
  attendance,
}) => {
  const {
    present,
    absent,
    late,
    presencePercentage,
    absentPercentage,
    latePercentage,
  } = attendance;

  // Safe percentage boundaries for SVG dash computation
  const pPct = Math.min(100, Math.max(0, presencePercentage));
  const aPct = Math.min(100 - pPct, Math.max(0, absentPercentage));
  const lPct = Math.min(100 - pPct - aPct, Math.max(0, latePercentage));

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-teal-50 shadow-2xs flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <CalendarTodayIcon className="w-4 h-4" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-800">
            Attendance Summary
          </h2>
        </div>
        <Link
          className="text-[11px] font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
          href="/attendance"
        >
          <span>View Details</span>
          <ArrowForwardIcon className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Donut Chart & Legend */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-around gap-3 mt-3">
        {/* Dynamic SVG Donut */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
            {/* Background Base Track */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              strokeWidth="4"
              fill="none"
              stroke="#f1f5f9"
            />

            {/* Segment 1: Present (Teal) */}
            {pPct > 0 && (
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#0f766e"
                strokeDasharray={`${pPct}, 100`}
                strokeDashoffset="0"
                strokeLinecap="round"
                strokeWidth="4.2"
                className="transition-all duration-700"
              />
            )}

            {/* Segment 2: Absent (Rose) */}
            {aPct > 0 && (
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#f87171"
                strokeDasharray={`${aPct}, 100`}
                strokeDashoffset={`${-pPct}`}
                strokeLinecap="round"
                strokeWidth="4.2"
                className="transition-all duration-700"
              />
            )}

            {/* Segment 3: Late (Amber) */}
            {lPct > 0 && (
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#f59e0b"
                strokeDasharray={`${lPct}, 100`}
                strokeDashoffset={`${-(pPct + aPct)}`}
                strokeLinecap="round"
                strokeWidth="4.2"
                className="transition-all duration-700"
              />
            )}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-black text-slate-900 leading-none">
              {presencePercentage}%
            </span>
            <span className="text-[8px] font-semibold text-slate-400 mt-0.5">
              Overall
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs font-medium min-w-32">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0f766e]" />
            <span className="text-slate-600 w-12">Present</span>
            <span className="font-bold text-slate-800">{present}</span>
            <span className="text-[#0f766e] font-bold ml-auto text-[11px]">
              {presencePercentage}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-slate-600 w-12">Absent</span>
            <span className="font-bold text-slate-800">{absent}</span>
            <span className="text-rose-500 font-bold ml-auto text-[11px]">
              {absentPercentage}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-600 w-12">Late</span>
            <span className="font-bold text-slate-800">{late}</span>
            <span className="text-amber-600 font-bold ml-auto text-[11px]">
              {latePercentage}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
