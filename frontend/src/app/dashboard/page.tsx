"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarTodayIcon,
  ChevronDownIcon,
  GroupIcon,
  CheckCircleIcon,
  CancelIcon,
  AccessTimeIcon,
  PaymentsIcon,
  ReceiptLongIcon,
  CheckIcon,
  ArrowForwardIcon,
} from "../../components/icons";

export default function DashboardPage() {
  return (
    <div className="px-4 sm:px-8 py-5 flex-1 space-y-5">
      {/* Page Title & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-block relative">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <div className="w-8 h-[3px] bg-[#10b981] rounded-full mt-0.5" />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Overview of your organization
          </p>
        </div>
        <div className="inline-flex items-center self-start sm:self-auto gap-2 px-3.5 py-1.5 bg-white rounded-xl border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer select-none">
          <CalendarTodayIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>November 2026</span>
          <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </div>
      </div>

      {/* 1. KPI Metrics Grid */}
      <section aria-label="KPI Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Employees */}
        <div className="bg-white rounded-2xl p-4 border border-teal-50 shadow-2xs relative overflow-hidden flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#ccf2ed] flex items-center justify-center shrink-0">
            <GroupIcon className="w-5 h-5 text-[#008272]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Employees</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-800">125</span>
              <span className="text-[11px] font-bold text-emerald-600">↑ +5%</span>
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-teal-50/60 rounded-full pointer-events-none" />
        </div>

        {/* Present Employees */}
        <div className="bg-white rounded-2xl p-4 border border-teal-50 shadow-2xs relative overflow-hidden flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#d0f5e7] flex items-center justify-center shrink-0">
            <CheckCircleIcon className="w-5 h-5 text-[#059669]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Present Employees</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-800">112</span>
              <span className="text-[11px] font-bold text-emerald-600">↑ +2%</span>
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-emerald-50/60 rounded-full pointer-events-none" />
        </div>

        {/* Absent Employees */}
        <div className="bg-white rounded-2xl p-4 border border-rose-50 shadow-2xs relative overflow-hidden flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#ffe4e3] flex items-center justify-center shrink-0">
            <CancelIcon className="w-5 h-5 text-[#ef4444]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Absent Employees</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-800">8</span>
              <span className="text-[11px] font-bold text-rose-500">↓ -1%</span>
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-rose-50/60 rounded-full pointer-events-none" />
        </div>

        {/* Late Employees */}
        <div className="bg-white rounded-2xl p-4 border border-purple-50 shadow-2xs relative overflow-hidden flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#ede9fe] flex items-center justify-center shrink-0">
            <AccessTimeIcon className="w-5 h-5 text-[#7c3aed]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Late Employees</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-800">5</span>
              <span className="text-[11px] font-bold text-emerald-600">↑ +1%</span>
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-purple-50/60 rounded-full pointer-events-none" />
        </div>
      </section>

      {/* 2. Middle Summaries Grid */}
      <section aria-label="Detailed Summaries" className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Attendance Summary */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-teal-50 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <CalendarTodayIcon className="w-4 h-4" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800">Attendance Summary</h2>
            </div>
            <Link
              className="text-[11px] font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
              href="/dashboard/attendance"
            >
              <span>View Details</span>
              <ArrowForwardIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-around gap-3 mt-2">
            <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  strokeWidth="4"
                  fill="none"
                  stroke="#e6f4f2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#0f766e"
                  strokeDasharray="91, 100"
                  strokeLinecap="round"
                  strokeWidth="4.2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f87171"
                  strokeDasharray="6, 100"
                  strokeDashoffset="-91"
                  strokeLinecap="round"
                  strokeWidth="4.2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f59e0b"
                  strokeDasharray="3, 100"
                  strokeDashoffset="-97"
                  strokeLinecap="round"
                  strokeWidth="4.2"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-slate-900 leading-none">91%</span>
                <span className="text-[8px] font-semibold text-slate-400 mt-0.5">Overall</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0f766e]" />
                <span className="text-slate-600 w-12">Present</span>
                <span className="font-bold text-slate-800">112</span>
                <span className="text-[#0f766e] font-bold ml-auto text-[11px]">91%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-slate-600 w-12">Absent</span>
                <span className="font-bold text-slate-800">8</span>
                <span className="text-rose-500 font-bold ml-auto text-[11px]">6%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-600 w-12">Late</span>
                <span className="font-bold text-slate-800">5</span>
                <span className="text-amber-600 font-bold ml-auto text-[11px]">3%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Monthly Payroll */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-teal-50 shadow-2xs flex flex-col justify-between overflow-hidden relative">
          <div>
            <div className="flex items-center gap-2 pb-1">
              <div className="p-1 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <PaymentsIcon className="w-4 h-4" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800">Total Monthly Payroll</h2>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">₹ 3,75,000</span>
              <span className="text-[11px] font-bold text-emerald-600">↑ +8%</span>
            </div>
          </div>
          <div className="w-full h-16 sm:h-20 mt-3 -mb-2">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 90">
              <defs>
                <linearGradient id="waveFill" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path
                d="M0,75 C50,68 80,45 120,48 C160,50 180,30 220,32 C260,34 280,10 300,12 L300,90 L0,90 Z"
                fill="url(#waveFill)"
              />
              <path
                d="M0,75 C50,68 80,45 120,48 C160,50 180,30 220,32 C260,34 280,10 300,12"
                fill="none"
                stroke="#0d9488"
                strokeLinecap="round"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>

        {/* Overtime Summary Bars */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-teal-50 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-1">
              <div className="p-1 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <AccessTimeIcon className="w-4 h-4" />
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800">Overtime Summary</h2>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">48 hrs</span>
              <span className="text-[11px] font-bold text-emerald-600">↑ +12%</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-16 pt-3">
            <div className="w-2.5 bg-[#b2ede2] rounded-t-sm h-[35%]" />
            <div className="w-2.5 bg-[#a3e8df] rounded-t-sm h-[48%]" />
            <div className="w-2.5 bg-[#82ded2] rounded-t-sm h-[60%]" />
            <div className="w-2.5 bg-[#5ecebe] rounded-t-sm h-[75%]" />
            <div className="w-2.5 bg-[#a3e8df] rounded-t-sm h-[50%]" />
            <div className="w-2.5 bg-[#6ed4c5] rounded-t-sm h-[65%]" />
            <div className="w-2.5 bg-[#b2ede2] rounded-t-sm h-[45%]" />
            <div className="w-2.5 bg-[#2ec4b6] rounded-t-sm h-[70%]" />
            <div className="w-2.5 bg-[#0f9f90] rounded-t-sm h-[88%]" />
            <div className="w-2.5 bg-[#008272] rounded-t-sm h-[100%] shadow-2xs" />
          </div>
        </div>
      </section>

      {/* 3. Bottom Status & Workplace Promo Grid */}
      <section aria-label="Status & Promo" className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Payroll Status */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-4 sm:p-5 border border-teal-50 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <ReceiptLongIcon className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-800">Payroll Status</h2>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  className="circle-bg"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  strokeWidth="4.5"
                  fill="none"
                  stroke="#e6f4f2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#008272"
                  strokeDasharray="80, 100"
                  strokeLinecap="round"
                  strokeWidth="4.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f59e0b"
                  strokeDasharray="20, 100"
                  strokeDashoffset="-80"
                  strokeLinecap="round"
                  strokeWidth="4.5"
                />
              </svg>
              <span className="absolute text-base font-black text-slate-800">80%</span>
            </div>
            <div className="space-y-1.5 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#008272]" />
                <span className="text-slate-600">Processed</span>
                <span className="font-bold text-slate-900 ml-1">100</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-slate-600">Pending</span>
                <span className="font-bold text-slate-900 ml-2">25</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dcfce7] text-[#15803d] text-[11px] font-bold">
                <span>Processing: 100</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffedd5] text-[#c2410c] text-[11px] font-bold">
                <span>Pending: 25</span>
              </div>
            </div>
          </div>
        </div>

        {/* Smarter HR Promo Card */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-4 sm:p-5 border border-teal-50 shadow-2xs relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center gap-2 relative">
            <svg className="w-12 h-16 sm:w-16 sm:h-20 text-[#6ec2b3]" fill="currentColor" viewBox="0 0 70 80">
              <path d="M10 80 C 10 50, 40 40, 50 80 Z" fill="#9de0d5" />
              <path d="M25 80 C 25 35, 65 30, 70 80 Z" fill="#66bdaf" />
              <path d="M0 80 C 0 60, 20 55, 30 80 Z" fill="#c3efe7" />
            </svg>
            <div className="relative w-20 h-16 sm:w-24 sm:h-20 bg-white rounded-xl border-2 border-[#168a7a] shadow-sm flex flex-col overflow-hidden">
              <div className="h-2.5 bg-[#e8f6f4] border-b border-[#168a7a] flex items-center justify-around px-2">
                <span className="w-1 h-2 rounded-full bg-[#168a7a]" />
                <span className="w-1 h-2 rounded-full bg-[#168a7a]" />
                <span className="w-1 h-2 rounded-full bg-[#168a7a]" />
              </div>
              <div className="p-1 grid grid-cols-4 gap-1 flex-1 items-center">
                <div className="w-full h-1.5 rounded bg-teal-100" />
                <div className="w-full h-1.5 rounded bg-teal-100" />
                <div className="w-full h-1.5 rounded bg-teal-100" />
                <div className="w-full h-1.5 rounded bg-teal-100" />
                <div className="w-full h-1.5 rounded bg-teal-100" />
                <div className="w-full h-1.5 rounded bg-teal-100" />
                <div className="w-full h-1.5 rounded bg-teal-100" />
                <div className="w-3.5 h-3.5 rounded bg-[#008b8b] text-white flex items-center justify-center text-[8px] font-bold">
                  <CheckIcon className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#168a7a] bg-white flex items-center justify-center relative shadow-2xs ml-1">
              <div className="w-1 h-1 bg-[#168a7a] rounded-full z-10" />
              <div className="absolute w-[2px] h-3.5 bg-[#168a7a] rounded top-2.5 origin-bottom -rotate-45" />
              <div className="absolute w-[2px] h-4 bg-[#168a7a] rounded top-2 origin-bottom rotate-45" />
            </div>
          </div>

          <div className="text-right pl-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              Smarter HR.
            </h3>
            <p className="text-xs sm:text-sm font-black text-slate-900">
              A Better Workplace.
            </p>
            <div className="w-12 sm:w-16 h-[2px] bg-[#10b981] rounded-full mt-1 ml-auto" />
          </div>
        </div>
      </section>
    </div>
  );
}
