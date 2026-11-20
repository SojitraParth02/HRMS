"use client";

import React from "react";
import { PayrollData, EmployeeSummary } from "../../types/payroll.types";
import {
  CloseIcon,
  CheckCircleIcon,
  ReceiptLongIcon,
  CalendarIcon,
  PersonIcon,
} from "../icons";

interface PayslipModalProps {
  payroll: PayrollData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({
  payroll,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !payroll) return null;

  const employee =
    typeof payroll.userId === "object"
      ? (payroll.userId as EmployeeSummary)
      : null;

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val ?? 0);
  };

  const formatMonthYear = (myStr: string) => {
    const [year, month] = myStr.split("-");
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const totalEarnings =
    payroll.baseSalary + payroll.overtimePay + (payroll.bonus || 0);
  const totalDeductions =
    payroll.lopDeduction +
    payroll.advanceDeduction +
    (payroll.otherDeductions || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 print:shadow-none print:border-none print:my-0">
        {/* Header - Not printed */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 print:hidden">
          <div className="flex items-center gap-2">
            <ReceiptLongIcon className="w-5 h-5 text-teal-700" />
            <h3 className="text-sm font-black text-slate-800">Monthly Salary Statement</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Payslip Body */}
        <div id="payslip-content" className="p-6 sm:p-8 space-y-6">
          {/* Company Branding & Statement Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
            <div>
              <div className="inline-block relative">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  HRMS ENTERPRISE
                </h1>
                <div className="w-8 h-[3px] bg-teal-600 rounded-full mt-1" />
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Official Payroll Statement & Remuneration Certificate
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-xs font-bold inline-flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                {payroll.status === "FINALIZED" ? "Paid & Finalized" : "Draft Calculation"}
              </span>
              <p className="text-xs font-bold text-slate-700 mt-1 font-mono">
                {formatMonthYear(payroll.monthYear)}
              </p>
            </div>
          </div>

          {/* Employee & Payroll Metadata Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Employee Name
              </span>
              <p className="font-bold text-slate-800 mt-0.5">
                {employee?.username || "Employee"}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Department
              </span>
              <p className="font-bold text-slate-800 mt-0.5">
                {employee?.department || "General"}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Designation
              </span>
              <p className="font-bold text-slate-800 mt-0.5">
                {employee?.designation || "Staff"}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Standard Working Days
              </span>
              <p className="font-bold text-slate-800 mt-0.5">
                {payroll.workingDaysStandard} Days (Statutory 26 Divisor)
              </p>
            </div>
          </div>

          {/* Dual Column Breakdown: Earnings vs Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Earnings */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black uppercase text-teal-800 tracking-wider">
                  Earnings Breakdown
                </span>
                <span className="text-xs font-bold text-teal-700">Amount (₹)</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Basic Monthly Salary</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(payroll.baseSalary)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Overtime Pay ({payroll.overtimeHours} hrs @ 1.5x)
                  </span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(payroll.overtimePay)}
                  </span>
                </div>
                {payroll.bonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Performance Bonus / Incentive</span>
                    <span className="font-semibold text-emerald-700">
                      +{formatCurrency(payroll.bonus)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 font-bold text-xs text-slate-900">
                <span>Gross Remuneration</span>
                <span className="text-teal-700">{formatCurrency(totalEarnings)}</span>
              </div>
            </div>

            {/* Right: Deductions */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-black uppercase text-rose-800 tracking-wider">
                  Deductions Breakdown
                </span>
                <span className="text-xs font-bold text-rose-700">Amount (₹)</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Loss of Pay (LOP) ({payroll.lopDaysCount} unpaid days)
                  </span>
                  <span className="font-semibold text-rose-700">
                    -{formatCurrency(payroll.lopDeduction)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">In-Month Advance Recovery</span>
                  <span className="font-semibold text-rose-700">
                    -{formatCurrency(payroll.advanceDeduction)}
                  </span>
                </div>
                {payroll.otherDeductions > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Other Deductions / Tax</span>
                    <span className="font-semibold text-rose-700">
                      -{formatCurrency(payroll.otherDeductions)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 font-bold text-xs text-slate-900">
                <span>Total Deductions</span>
                <span className="text-rose-700">-{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Big Net Salary Callout */}
          <div className="bg-linear-to-r from-teal-700 to-teal-800 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-200">
                Net Disbursed Take-Home Pay
              </p>
              <p className="text-[11px] text-teal-100/90 mt-0.5">
                Credited directly to registered bank account
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
                {formatCurrency(payroll.netSalary)}
              </p>
            </div>
          </div>

          {/* Notes & Disclaimer */}
          {payroll.notes && (
            <p className="text-[11px] text-slate-500 italic border-l-2 border-teal-500 pl-3">
              Note: {payroll.notes}
            </p>
          )}

          <div className="pt-4 border-t border-slate-200/80 text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
            <span>This is a computer-generated payroll advice. No physical signature is required.</span>
            <span>Generated via HRMS Enterprise Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
};
