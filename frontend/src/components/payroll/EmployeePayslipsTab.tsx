"use client";

import React, { useState } from "react";
import { useMyPayslipsQuery } from "../../hooks/queries/usePayroll";
import { PayrollData } from "../../types/payroll.types";
import { PayslipModal } from "./PayslipModal";
import { Pagination } from "../common/Pagination";
import {
  ReceiptLongIcon,
  CheckCircleIcon,
  CalendarIcon,
  PaymentsIcon,
} from "../icons";

export const EmployeePayslipsTab: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const { data, isLoading } = useMyPayslipsQuery(page, limit);
  const [selectedForPayslip, setSelectedForPayslip] = useState<PayrollData | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatMonthYear = (myStr: string) => {
    const [year, month] = myStr.split("-");
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const records = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-teal-50 shadow-2xs">
        <h2 className="text-base font-black text-slate-800 tracking-tight">
          My Salary Statements & Payslips
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Access and download your finalized monthly payroll receipts and earnings breakdown
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading your payslips...</div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 space-y-2">
          <ReceiptLongIcon className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No Finalized Payslips Available</p>
          <p className="text-xs max-w-sm mx-auto">
            Your payslip will appear here once HR completes and finalizes the monthly payroll run.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((p) => {
            const grossEarnings = p.baseSalary + p.overtimePay + (p.bonus || 0);
            const totalDeductions = p.lopDeduction + p.advanceDeduction + (p.otherDeductions || 0);

            return (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4 hover:border-teal-200 transition-all"
              >
                {/* Pay Period & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">
                        {formatMonthYear(p.monthYear)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold font-mono">
                        Cycle: {p.monthYear}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                    Paid
                  </span>
                </div>

                {/* Net Salary Highlight */}
                <div className="p-3.5 bg-slate-50/70 rounded-xl flex items-baseline justify-between border border-slate-100">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Net Disbursed
                  </span>
                  <span className="text-xl font-black text-teal-800 font-mono">
                    {formatCurrency(p.netSalary)}
                  </span>
                </div>

                {/* Breakdown Summary */}
                <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Earnings:</span>
                    <span className="font-semibold text-slate-700 font-mono">
                      {formatCurrency(grossEarnings)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Deductions:</span>
                    <span className="font-semibold text-rose-700 font-mono">
                      -{formatCurrency(totalDeductions)}
                    </span>
                  </div>
                </div>

                {/* View Action */}
                <button
                  type="button"
                  onClick={() => setSelectedForPayslip(p)}
                  className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ReceiptLongIcon className="w-4 h-4 text-teal-700" />
                  <span>View / Download Payslip</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {records.length > 0 && (
        <Pagination
          currentPage={pagination?.currentPage || page}
          pageSize={pagination?.pageSize || limit}
          totalRecords={pagination?.totalRecords || 0}
          totalPages={pagination?.totalPages || 1}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setLimit(s);
            setPage(1);
          }}
        />
      )}

      {/* Payslip Modal */}
      <PayslipModal
        payroll={selectedForPayslip}
        isOpen={Boolean(selectedForPayslip)}
        onClose={() => setSelectedForPayslip(null)}
      />
    </div>
  );
};
