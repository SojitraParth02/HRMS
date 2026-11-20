"use client";

import React, { useState } from "react";
import { useAppSelector } from "../../hooks/redux";
import { PayrollRunTable } from "./PayrollRunTable";
import { OvertimeManagementTab } from "./OvertimeManagementTab";
import { SalaryAdvanceTab } from "./SalaryAdvanceTab";
import { EmployeePayslipsTab } from "./EmployeePayslipsTab";
import {
  ReceiptLongIcon,
  AccessTimeIcon,
  PaymentsIcon,
} from "../icons";

type PayrollTab = "payroll" | "overtime" | "advances" | "payslips";

export const PayrollView: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isPrivileged =
    currentUser?.role === "HR" || currentUser?.role === "ADMIN";

  // Default to 'payroll' for HR/Admin, 'payslips' for normal employee
  const [activeTab, setActiveTab] = useState<PayrollTab>(
    isPrivileged ? "payroll" : "payslips"
  );

  return (
    <div className="px-4 sm:px-8 py-6 flex-1 space-y-6">
      {/* Page Title & Subtitle */}
      <div>
        <div className="inline-block relative">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Payroll & Compensation
          </h1>
          <div className="w-10 h-[3px] bg-teal-600 rounded-full mt-1" />
        </div>
        <p className="text-xs text-slate-500 font-medium mt-1">
          {currentUser?.role === "ADMIN"
            ? "Statutory 26-day divisor calculation engine, workforce overtime approvals & salary advances"
            : isPrivileged
            ? "Statutory 26-day divisor calculation engine, overtime approvals, advances & personal payslips"
            : "View your monthly payslips, submit overtime requests, and check salary advances"}
        </p>
      </div>

      {/* Modern Pill Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl w-fit border border-slate-200/60 overflow-x-auto max-w-full">
        {isPrivileged && (
          <button
            type="button"
            onClick={() => setActiveTab("payroll")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "payroll"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <ReceiptLongIcon className="w-3.5 h-3.5" />
            <span>Payroll Processing</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("overtime")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "overtime"
              ? "bg-teal-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <AccessTimeIcon className="w-3.5 h-3.5" />
          <span>{isPrivileged ? "Overtime Approvals" : "My Overtime"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("advances")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "advances"
              ? "bg-teal-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <PaymentsIcon className="w-3.5 h-3.5" />
          <span>{isPrivileged ? "Salary Advances" : "My Advances"}</span>
        </button>

        {currentUser?.role !== "ADMIN" && (
          <button
            type="button"
            onClick={() => setActiveTab("payslips")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "payslips"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <ReceiptLongIcon className="w-3.5 h-3.5" />
            <span>My Payslips</span>
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "payroll" && isPrivileged && <PayrollRunTable />}
        {activeTab === "overtime" && <OvertimeManagementTab />}
        {activeTab === "advances" && <SalaryAdvanceTab />}
        {activeTab === "payslips" && currentUser?.role !== "ADMIN" && <EmployeePayslipsTab />}
      </div>
    </div>
  );
};
