"use client";

import React, { useState } from "react";
import {
  PayrollData,
  PaymentMethod,
  EmployeeSummary,
} from "../../types/payroll.types";
import {
  useMarkPayrollPaidMutation,
  useMarkMonthPayrollPaidMutation,
} from "../../hooks/queries/usePayroll";
import { PaymentsIcon, CloseIcon, CheckCircleIcon } from "../icons";

interface MarkPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If targetRecord is provided, it's single employee mode; otherwise bulk mode
  targetRecord?: PayrollData | null;
  bulkMonthYear?: string | null;
  bulkCount?: number;
  bulkTotalAmount?: number;
}

export const MarkPaidModal: React.FC<MarkPaidModalProps> = ({
  isOpen,
  onClose,
  targetRecord,
  bulkMonthYear,
  bulkCount = 0,
  bulkTotalAmount = 0,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANK_TRANSFER");
  const [transactionReference, setTransactionReference] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const markSingleMutation = useMarkPayrollPaidMutation();
  const markBulkMutation = useMarkMonthPayrollPaidMutation();

  if (!isOpen) return null;

  const isBulk = !targetRecord && Boolean(bulkMonthYear);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getEmployeeName = (emp: string | EmployeeSummary) => {
    if (typeof emp === "object" && emp !== null) {
      return emp.username;
    }
    return "Employee";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      if (isBulk && bulkMonthYear) {
        await markBulkMutation.mutateAsync({
          monthYear: bulkMonthYear,
          paymentMethod,
          transactionReference: transactionReference.trim() || undefined,
        });
      } else if (targetRecord) {
        await markSingleMutation.mutateAsync({
          id: targetRecord._id,
          payload: {
            paymentMethod,
            transactionReference: transactionReference.trim() || undefined,
          },
        });
      }
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to mark salary as paid. Please try again.";
      setErrorMsg(msg);
    }
  };

  const isPending = markSingleMutation.isPending || markBulkMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mark-paid-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-md w-full border border-teal-50 shadow-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <PaymentsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="mark-paid-modal-title"
                className="text-base font-black text-slate-900 tracking-tight"
              >
                {isBulk ? "Disburse Bulk Payroll" : "Record Salary Payment"}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {isBulk
                  ? `Mark all finalized salaries as disbursed for ${bulkMonthYear}`
                  : `Record payment disbursement for ${getEmployeeName(targetRecord!.userId)}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Payment Summary Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              {isBulk ? "Recipients:" : "Employee:"}
            </span>
            <span className="font-bold text-slate-800">
              {isBulk
                ? `${bulkCount} finalized staff member(s)`
                : getEmployeeName(targetRecord!.userId)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Billing Period:</span>
            <span className="font-bold text-slate-800">
              {isBulk ? bulkMonthYear : targetRecord?.monthYear}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm">
            <span className="text-slate-700 font-bold">Total Disbursement:</span>
            <span className="text-base font-black text-emerald-700">
              {isBulk
                ? formatCurrency(bulkTotalAmount)
                : formatCurrency(targetRecord?.netSalary || 0)}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Disbursement Method <span className="text-rose-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 bg-white"
            >
              <option value="BANK_TRANSFER">Direct Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="UPI">Corporate UPI / VPA Payout</option>
              <option value="CHEQUE">Company Account Payee Cheque</option>
              <option value="CASH">Cash in Hand Disbursement</option>
            </select>
          </div>

          {/* Reference / UTR Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Transaction / UTR Reference ID{" "}
              <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. UTR1982736410 or CHQ-4029"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <CheckCircleIcon className="w-4 h-4" />
              <span>
                {isPending
                  ? "Recording Payment..."
                  : isBulk
                  ? "Confirm & Disburse All"
                  : "Confirm & Mark Paid"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
