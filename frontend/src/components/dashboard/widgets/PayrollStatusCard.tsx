"use client";

import React from "react";
import Link from "next/link";
import { ReceiptLongIcon, ArrowForwardIcon } from "../../icons";
import { PayrollSummary } from "../../../types/dashboard.types";

interface PayrollStatusCardProps {
  payroll: PayrollSummary;
}

export const PayrollStatusCard: React.FC<PayrollStatusCardProps> = ({ payroll }) => {
  const { processedCount, pendingCount, processedPercentage } = payroll;
  const total = processedCount + pendingCount;
  const pendingPercentage = total > 0 ? Math.max(0, 100 - processedPercentage) : 0;

  const procPct = Math.min(100, Math.max(0, processedPercentage));
  const pendPct = Math.min(100 - procPct, Math.max(0, pendingPercentage));

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-teal-50 shadow-2xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-50 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <ReceiptLongIcon className="w-4 h-4" />
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-800">
            Payroll Status
          </h2>
        </div>
        <Link
          href="/payroll"
          className="text-[11px] font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
        >
          <span>Ledger</span>
          <ArrowForwardIcon className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
        {/* Dynamic SVG Donut */}
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              strokeWidth="4.5"
              fill="none"
              stroke="#f1f5f9"
            />
            {procPct > 0 && (
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#008272"
                strokeDasharray={`${procPct}, 100`}
                strokeDashoffset="0"
                strokeLinecap="round"
                strokeWidth="4.5"
                className="transition-all duration-700"
              />
            )}
            {pendPct > 0 && (
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#f59e0b"
                strokeDasharray={`${pendPct}, 100`}
                strokeDashoffset={`${-procPct}`}
                strokeLinecap="round"
                strokeWidth="4.5"
                className="transition-all duration-700"
              />
            )}
          </svg>
          <span className="absolute text-base font-black text-slate-800">
            {processedPercentage}%
          </span>
        </div>

        {/* Legend */}
        <div className="space-y-1.5 text-xs font-semibold min-w-28">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#008272]" />
            <span className="text-slate-600">Processed</span>
            <span className="font-bold text-slate-900 ml-1">{processedCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-600">Pending</span>
            <span className="font-bold text-slate-900 ml-2">{pendingCount}</span>
          </div>
        </div>

        {/* Status Action Chips */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dcfce7] text-[#15803d] text-[11px] font-bold">
            <span>Processed: {processedCount}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffedd5] text-[#c2410c] text-[11px] font-bold">
            <span>Draft/Pending: {pendingCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
