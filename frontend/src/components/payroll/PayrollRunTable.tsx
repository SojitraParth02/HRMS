"use client";

import React, { useState, useEffect } from "react";
import {
  PayrollData,
  EmployeeSummary,
} from "../../types/payroll.types";
import {
  usePayrollRecordsQuery,
  useRunPayrollMutation,
  useFinalizePayrollMutation,
} from "../../hooks/queries/usePayroll";
import { useDebounce } from "../../hooks/useDebounce";
import { HighlightText } from "../common/HighlightText";
import { PayrollAdjustmentModal } from "./PayrollAdjustmentModal";
import { PayslipModal } from "./PayslipModal";
import { MarkPaidModal } from "./MarkPaidModal";
import { Pagination } from "../common/Pagination";
import {
  PaymentsIcon,
  CheckCircleIcon,
  WarningIcon,
  EditIcon,
  LockIcon,
  ReceiptLongIcon,
  SearchIcon,
  RestartAltIcon,
} from "../icons";

export const PayrollRunTable: React.FC = () => {
  const currentMonthYear = new Date().toISOString().slice(0, 7);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(currentMonthYear);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [selectedForAdjustment, setSelectedForAdjustment] = useState<PayrollData | null>(null);
  const [selectedForPayslip, setSelectedForPayslip] = useState<PayrollData | null>(null);
  const [selectedForPayment, setSelectedForPayment] = useState<PayrollData | null>(null);
  const [isBulkPaymentOpen, setIsBulkPaymentOpen] = useState<boolean>(false);
  const [isFinalizeConfirmOpen, setIsFinalizeConfirmOpen] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedMonthYear]);

  const { data: payrollResponse, isLoading, isFetching } = usePayrollRecordsQuery(selectedMonthYear, debouncedSearch, page, limit);
  const payrolls = payrollResponse?.data ?? [];
  const pagination = payrollResponse?.pagination;
  const runMutation = useRunPayrollMutation();
  const finalizeMutation = useFinalizePayrollMutation();

  const isFinalized = payrolls.length > 0 && payrolls.every((p) => p.status === "FINALIZED");
  const hasDrafts = payrolls.some((p) => p.status === "DRAFT");

  const unpaidFinalizedPayrolls = payrolls.filter(
    (p) => p.status === "FINALIZED" && !p.isPaid
  );
  const unpaidCount = unpaidFinalizedPayrolls.length;
  const unpaidTotalAmount = unpaidFinalizedPayrolls.reduce(
    (sum, p) => sum + p.netSalary,
    0
  );
  const paidCount = payrolls.filter((p) => p.isPaid).length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleRunPayroll = async () => {
    try {
      setFeedbackMsg(null);
      await runMutation.mutateAsync(selectedMonthYear);
      setFeedbackMsg({
        type: "success",
        text: `Draft payroll calculated successfully for ${selectedMonthYear}.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to run payroll calculation.";
      setFeedbackMsg({ type: "error", text: msg });
    }
  };

  const handleConfirmFinalize = async () => {
    try {
      setFeedbackMsg(null);
      await finalizeMutation.mutateAsync(selectedMonthYear);
      setIsFinalizeConfirmOpen(false);
      setFeedbackMsg({
        type: "success",
        text: `Payroll for ${selectedMonthYear} has been finalized, locked, and payslip notifications sent!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to finalize payroll.";
      setFeedbackMsg({ type: "error", text: msg });
    }
  };

  const totalDisbursement = payrolls.reduce((sum, p) => sum + p.netSalary, 0);

  return (
    <div className="space-y-6">
      {/* 1. Control Bar: Month-Year Selector, Action Triggers, Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-teal-50/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700">Billing Cycle:</label>
            <input
              type="month"
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
          </div>

          <button
            type="button"
            onClick={handleRunPayroll}
            disabled={runMutation.isPending || isFinalized}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            {runMutation.isPending ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Calculating...</span>
              </>
            ) : (
              <>
                <RestartAltIcon className="w-4 h-4" />
                <span>{payrolls.length > 0 ? "Recalculate Draft" : "Calculate Draft Payroll"}</span>
              </>
            )}
          </button>

          {hasDrafts && (
            <button
              type="button"
              onClick={() => setIsFinalizeConfirmOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <LockIcon className="w-3.5 h-3.5" />
              <span>Finalize & Lock Payroll</span>
            </button>
          )}

          {isFinalized && unpaidCount > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkPaymentOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <PaymentsIcon className="w-4 h-4" />
              <span>Disburse All ({unpaidCount})</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          />
        </div>
      </div>

      {/* Feedback Message */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === "success" ? (
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <WarningIcon className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Cycle Summary Strip */}
      {payrolls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-teal-50 shadow-2xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Employees Processed
            </span>
            <p className="text-base font-black text-slate-800 mt-0.5">{payrolls.length}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Net Disbursement
            </span>
            <p className="text-base font-black text-teal-700 mt-0.5">
              {formatCurrency(totalDisbursement)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Cycle Status
            </span>
            <div className="mt-1">
              {isFinalized ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <LockIcon className="w-3 h-3 text-emerald-600" />
                  Locked & Finalized
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Draft Mode (Editable)
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Calculation Standard
            </span>
            <p className="text-xs font-bold text-slate-700 mt-1">26 Days Divisor Rule</p>
          </div>
        </div>
      )}

      {/* 2. Responsive Payroll Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        {isLoading || isFetching ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" />
            <span>Loading payroll records for {selectedMonthYear}...</span>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <PaymentsIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              {debouncedSearch
                ? `No payroll records matching "${debouncedSearch}"`
                : `No payroll calculated for ${selectedMonthYear}`}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {debouncedSearch
                ? "Try searching with a different employee name, department, or designation."
                : "Click \"Calculate Draft Payroll\" above to run the 26-Day Divisor engine for all active employees."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-3">Base Salary</th>
                  <th className="py-3.5 px-3">LOP Days / ₹</th>
                  <th className="py-3.5 px-3">OT Hours / ₹</th>
                  <th className="py-3.5 px-3">Advance</th>
                  <th className="py-3.5 px-3">Bonus / Adj</th>
                  <th className="py-3.5 px-3">Net Pay</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Disbursement</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {payrolls.map((payroll) => {
                  const emp =
                    typeof payroll.userId === "object"
                      ? (payroll.userId as EmployeeSummary)
                      : null;

                  return (
                    <tr
                      key={payroll._id}
                      className="hover:bg-teal-50/20 transition-colors"
                    >
                      {/* Employee Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                            {emp?.username?.charAt(0) || "E"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              <HighlightText
                                text={emp?.username || "Employee"}
                                query={debouncedSearch}
                              />
                            </p>
                            <p className="text-[10px] text-slate-400">
                              <HighlightText
                                text={emp?.department || "General"}
                                query={debouncedSearch}
                              />
                              {" • "}
                              <HighlightText
                                text={emp?.designation || "Staff"}
                                query={debouncedSearch}
                              />
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Base Salary */}
                      <td className="py-3 px-3 font-semibold text-slate-800 font-mono">
                        {formatCurrency(payroll.baseSalary)}
                      </td>

                      {/* LOP Days & Deduction */}
                      <td className="py-3 px-3">
                        {payroll.lopDaysCount > 0 ? (
                          <div>
                            <span className="font-bold text-rose-700 font-mono">
                              -{formatCurrency(payroll.lopDeduction)}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {payroll.lopDaysCount} unpaid day{payroll.lopDaysCount > 1 ? "s" : ""}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>

                      {/* Overtime Hours & Pay */}
                      <td className="py-3 px-3">
                        {payroll.overtimeHours > 0 ? (
                          <div>
                            <span className="font-bold text-teal-700 font-mono">
                              +{formatCurrency(payroll.overtimePay)}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {payroll.overtimeHours} hrs @ 1.5x
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">0h</span>
                        )}
                      </td>

                      {/* Advance Deduction */}
                      <td className="py-3 px-3">
                        {payroll.advanceDeduction > 0 ? (
                          <span className="font-bold text-rose-700 font-mono">
                            -{formatCurrency(payroll.advanceDeduction)}
                          </span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>

                      {/* Bonus & Other Adjustments */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <div>
                            {payroll.bonus > 0 && (
                              <p className="text-emerald-700 font-bold font-mono">
                                +{formatCurrency(payroll.bonus)}
                              </p>
                            )}
                            {payroll.otherDeductions > 0 && (
                              <p className="text-rose-700 font-bold font-mono">
                                -{formatCurrency(payroll.otherDeductions)}
                              </p>
                            )}
                            {payroll.bonus === 0 && payroll.otherDeductions === 0 && (
                              <span className="text-slate-400">₹0</span>
                            )}
                          </div>
                          {payroll.status === "DRAFT" && (
                            <button
                              type="button"
                              onClick={() => setSelectedForAdjustment(payroll)}
                              className="p-1 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                              title="Edit Adjustments"
                            >
                              <EditIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Net Pay */}
                      <td className="py-3 px-3">
                        <span className="text-sm font-black text-teal-800 font-mono">
                          {formatCurrency(payroll.netSalary)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {payroll.status === "FINALIZED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                            Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Disbursement */}
                      <td className="py-3 px-3">
                        {payroll.isPaid ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                              Paid
                            </span>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                              {payroll.paymentMethod ? payroll.paymentMethod.replace("_", " ") : "Direct"}
                              {payroll.paidAt && ` • ${new Date(payroll.paidAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`}
                            </p>
                          </div>
                        ) : payroll.status === "FINALIZED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            ● Unpaid
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">--</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {payroll.status === "FINALIZED" && !payroll.isPaid && (
                            <button
                              type="button"
                              onClick={() => setSelectedForPayment(payroll)}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                              title="Mark Salary as Paid"
                            >
                              <PaymentsIcon className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Pay</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedForPayslip(payroll)}
                            className="px-2.5 py-1 text-xs font-bold text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <ReceiptLongIcon className="w-3.5 h-3.5 text-teal-700" />
                            <span>Payslip</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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
      </div>

      {/* Finalize Confirmation Modal */}
      {isFinalizeConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <LockIcon className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Finalize & Lock Payroll for {selectedMonthYear}?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This action is <strong>irreversible</strong>. It will lock salary numbers, mark in-month advances as deducted, and send real-time payslip notifications to all employees.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFinalizeConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalize}
                disabled={finalizeMutation.isPending}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {finalizeMutation.isPending ? "Locking..." : "Yes, Finalize & Lock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjustments Modal */}
      <PayrollAdjustmentModal
        payroll={selectedForAdjustment}
        isOpen={Boolean(selectedForAdjustment)}
        onClose={() => setSelectedForAdjustment(null)}
      />

      {/* Payslip View Modal */}
      <PayslipModal
        payroll={selectedForPayslip}
        isOpen={Boolean(selectedForPayslip)}
        onClose={() => setSelectedForPayslip(null)}
      />

      {/* Mark Individual Record Paid Modal */}
      <MarkPaidModal
        isOpen={Boolean(selectedForPayment)}
        onClose={() => setSelectedForPayment(null)}
        targetRecord={selectedForPayment}
      />

      {/* Mark Month Paid Bulk Modal */}
      <MarkPaidModal
        isOpen={isBulkPaymentOpen}
        onClose={() => setIsBulkPaymentOpen(false)}
        bulkMonthYear={selectedMonthYear}
        bulkCount={unpaidCount}
        bulkTotalAmount={unpaidTotalAmount}
      />
    </div>
  );
};
