"use client";

import React from "react";
import Link from "next/link";
import {
  WarningIcon,
  CheckCircleIcon,
  CalendarIcon,
  AccessTimeIcon,
  ArrowForwardIcon,
} from "../../icons";
import { ActionQueue } from "../../../types/dashboard.types";

interface ActionQueueBannerProps {
  actionQueue: ActionQueue;
}

export const ActionQueueBanner: React.FC<ActionQueueBannerProps> = ({
  actionQueue,
}) => {
  const {
    pendingLeaves,
    pendingCorrections,
    pendingOvertime,
    totalPending,
  } = actionQueue;

  if (totalPending === 0) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-emerald-900">
              Operations are running smoothly
            </h3>
            <p className="text-[11px] text-emerald-700 font-medium">
              All leave requests, overtime submissions, and attendance corrections have been reviewed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-200/80 flex items-center justify-center text-amber-800 shrink-0">
            <WarningIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-amber-950 tracking-tight">
              Action Required: {totalPending} Pending Workforce Requests
            </h3>
            <p className="text-[11px] text-amber-800 font-medium">
              Submissions awaiting administrative review and approval
            </p>
          </div>
        </div>
      </div>

      {/* Action Chips / Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Pending Leaves */}
        <Link
          href="/leaves"
          className="bg-white/90 hover:bg-white p-3 rounded-xl border border-amber-200/70 flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Leave Requests
              </p>
              <p className="text-base font-black text-slate-800">
                {pendingLeaves} <span className="text-[10px] font-semibold text-amber-700">pending</span>
              </p>
            </div>
          </div>
          <ArrowForwardIcon className="w-4 h-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* 2. Pending Attendance Corrections */}
        <Link
          href="/attendance"
          className="bg-white/90 hover:bg-white p-3 rounded-xl border border-amber-200/70 flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <AccessTimeIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Punch Corrections
              </p>
              <p className="text-base font-black text-slate-800">
                {pendingCorrections} <span className="text-[10px] font-semibold text-amber-700">pending</span>
              </p>
            </div>
          </div>
          <ArrowForwardIcon className="w-4 h-4 text-slate-400 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-all" />
        </Link>

        {/* 3. Pending Overtime Requests */}
        <Link
          href="/payroll"
          className="bg-white/90 hover:bg-white p-3 rounded-xl border border-amber-200/70 flex items-center justify-between transition-all group shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <AccessTimeIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Overtime Claims
              </p>
              <p className="text-base font-black text-slate-800">
                {pendingOvertime} <span className="text-[10px] font-semibold text-amber-700">pending</span>
              </p>
            </div>
          </div>
          <ArrowForwardIcon className="w-4 h-4 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>
    </div>
  );
};
