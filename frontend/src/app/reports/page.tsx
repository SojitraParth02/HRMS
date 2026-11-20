"use client";

import React from "react";
import DashboardLayout from "../dashboard/layout";
import {
  CalendarIcon,
  GroupIcon,
  PaymentsIcon,
  AccessTimeIcon,
} from "../../components/icons";

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="px-4 sm:px-8 py-6 flex-1 space-y-6">
        <div>
          <div className="inline-block relative">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Reports & Workforce Analytics
            </h1>
            <div className="w-10 h-[3px] bg-teal-600 rounded-full mt-1" />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Comprehensive audit reports, attendance patterns, leave utilization & payroll expenditure
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-teal-50 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Attendance Punctuality</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <AccessTimeIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">96.4%</p>
            <p className="text-[11px] text-teal-600 font-semibold">+2.1% improvement this month</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-teal-50 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Leave Utilization</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">72.8%</p>
            <p className="text-[11px] text-slate-500 font-semibold">Average 3.6 days remaining</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-teal-50 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Overtime Volume</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <AccessTimeIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">142 hrs</p>
            <p className="text-[11px] text-amber-600 font-semibold">Across 18 approved submissions</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-teal-50 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Active Headcount</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <GroupIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">100%</p>
            <p className="text-[11px] text-slate-500 font-semibold">Verified workforce roster</p>
          </div>
        </div>

        {/* Report Download Cards */}
        <div className="bg-white rounded-2xl border border-teal-50 shadow-2xs p-6 space-y-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Exportable Audit Statements</h3>
            <p className="text-xs text-slate-500">Download formatted workforce compliance summaries</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <AccessTimeIcon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Monthly Attendance Log</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Biometric punch timestamps, break durations, and late arrival minutes.
              </p>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                Print / Save PDF
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Leave Balance Summary</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Paid vs. Loss of Pay (LOP) days taken, pending requests, and quotas.
              </p>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                Print / Save PDF
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <PaymentsIcon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Payroll Expenditure Sheet</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Gross base salary, overtime wages (1.5x), advance recoveries, and net payout.
              </p>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
