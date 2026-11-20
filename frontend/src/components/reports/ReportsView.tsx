"use client";

import React, { useState } from "react";
import { useAppSelector } from "../../hooks/redux";
import { AttendanceReportTab } from "./AttendanceReportTab";
import { PayrollReportTab } from "./PayrollReportTab";
import { OvertimeReportTab } from "./OvertimeReportTab";
import {
  CalendarIcon,
  PaymentsIcon,
  AccessTimeIcon,
  WarningIcon,
} from "../icons";

type ReportTabType = "attendance" | "payroll" | "overtime";

export const ReportsView: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isPrivileged =
    currentUser?.role === "ADMIN" || currentUser?.role === "HR";

  const [activeTab, setActiveTab] = useState<ReportTabType>("attendance");

  if (!isPrivileged) {
    return (
      <div className="px-4 sm:px-8 py-12 flex-1 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <WarningIcon className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-500 max-w-sm">
            You do not have permission to access analytics and reports. Please
            contact an administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 py-6 flex-1 space-y-6">
      {/* Page Title & Subtitle */}
      <div>
        <div className="inline-block relative">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Enterprise Reports & Analytics
          </h1>
          <div className="w-10 h-[3px] bg-teal-600 rounded-full mt-1" />
        </div>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Dynamically aggregated workforce attendance, payroll expenditure, and overtime utilization with RFC-4180 CSV export
        </p>
      </div>

      {/* Modern Pill Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl w-fit border border-slate-200/60 overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === "attendance"
              ? "bg-white text-teal-800 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-teal-600" />
          <span>Attendance Report</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("payroll")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === "payroll"
              ? "bg-white text-teal-800 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <PaymentsIcon className="w-4 h-4 text-teal-600" />
          <span>Payroll Expenditure</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("overtime")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            activeTab === "overtime"
              ? "bg-white text-teal-800 shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <AccessTimeIcon className="w-4 h-4 text-teal-600" />
          <span>Overtime Utilization</span>
        </button>
      </div>

      {/* Active Tab Content */}
      <div className="mt-4">
        {activeTab === "attendance" && <AttendanceReportTab />}
        {activeTab === "payroll" && <PayrollReportTab />}
        {activeTab === "overtime" && <OvertimeReportTab />}
      </div>
    </div>
  );
};
