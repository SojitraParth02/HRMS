"use client";

import React, { useState, useEffect } from "react";
import { useApplyLeaveMutation } from "../../hooks/queries/useLeaves";
import { LeaveBalanceData, LeaveType } from "../../types/leave.types";
import {
  CloseIcon,
  CalendarIcon,
  WarningIcon,
  CancelIcon,
} from "../icons";

interface ApplyLeaveModalProps {
  isOpen: boolean;
  balance: LeaveBalanceData | null;
  onClose: () => void;
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({
  isOpen,
  balance,
  onClose,
}) => {
  const applyMutation = useApplyLeaveMutation();

  const [leaveType, setLeaveType] = useState<LeaveType>("FULL_DAY");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [reason, setReason] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];
      setLeaveType("FULL_DAY");
      setStartDate(today);
      setEndDate(today);
      setReason("");
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const remainingPaidDays = balance?.remainingPaidDays ?? 0;
  const isPaidQuotaExhausted = remainingPaidDays <= 0;

  // Calculate requested days
  let requestedDays = 1;
  if (leaveType === "HALF_DAY") {
    requestedDays = 0.5;
  } else {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    requestedDays = Math.max(1, diff);
  }

  // Calculate split
  const paidDaysCount = Math.min(remainingPaidDays, requestedDays);
  const lossOfPayDays = requestedDays - paidDaysCount;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMessage(null);

    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMessage("Please enter a valid reason (at least 5 characters).");
      return;
    }

    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp =
      leaveType === "HALF_DAY" ? startTimestamp : new Date(endDate).getTime();

    if (startTimestamp > endTimestamp) {
      setErrorMessage("Start date cannot be after end date.");
      return;
    }

    try {
      await applyMutation.mutateAsync({
        startDate,
        endDate: leaveType === "HALF_DAY" ? startDate : endDate,
        leaveType,
        reason: reason.trim(),
      });
      onClose();
    } catch (error: unknown) {
      interface ErrorResponse {
        response?: { data?: { message?: string } };
        message?: string;
      }
      const err = error as ErrorResponse;
      setErrorMessage(
        err.response?.data?.message ??
          err.message ??
          "Failed to submit leave application."
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Apply for Leave
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Submit leave request for management approval
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
            <CancelIcon className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Prominent Paid Leave Exhaustion Warning Banner */}
          {isPaidQuotaExhausted && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs animate-in fade-in duration-150">
              <WarningIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Loss of Pay (LOP) Notice:</p>
                <p className="text-[11px] mt-0.5 text-amber-800">
                  Your paid leaves are finished. Any further leave you take will
                  be treated as <strong>Unpaid Leave (Loss of Pay - LOP)</strong> and
                  deducted during payroll.
                </p>
              </div>
            </div>
          )}

          {/* Leave Type Toggle: Full Day vs Half Day */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Leave Duration Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLeaveType("FULL_DAY")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  leaveType === "FULL_DAY"
                    ? "bg-teal-700 text-white border-teal-700 shadow-sm shadow-teal-700/20"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Full Day</span>
              </button>

              <button
                type="button"
                onClick={() => setLeaveType("HALF_DAY")}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  leaveType === "HALF_DAY"
                    ? "bg-teal-700 text-white border-teal-700 shadow-sm shadow-teal-700/20"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Half Day (0.5)</span>
              </button>
            </div>

            {leaveType === "HALF_DAY" && (
              <p className="mt-1.5 text-[11px] text-teal-800 bg-teal-50/60 border border-teal-200/60 p-2 rounded-lg">
                ℹ️ <strong>Half-Day Policy:</strong> Officially begins post-lunch
                from <strong>1:00 PM to 6:00 PM</strong> (0.5 day).
              </p>
            )}
          </div>

          {/* Date Range Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (leaveType === "HALF_DAY") {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 transition cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={leaveType === "HALF_DAY"}
                value={leaveType === "HALF_DAY" ? startDate : endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm transition ${
                  leaveType === "HALF_DAY"
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-slate-50 text-slate-900 border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                }`}
              />
            </div>
          </div>

          {/* Quota Impact Summary Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
            <span className="text-slate-600 font-medium">
              Requested: <strong>{requestedDays} {requestedDays === 1 ? "day" : "days"}</strong>
            </span>
            <div className="flex items-center gap-2 text-[11px] font-bold">
              {paidDaysCount > 0 && (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                  {paidDaysCount} Paid
                </span>
              )}
              {lossOfPayDays > 0 && (
                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
                  {lossOfPayDays} Unpaid (LOP)
                </span>
              )}
            </div>
          </div>

          {/* Reason Field */}
          <div>
            <label
              htmlFor="leave-reason"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Reason for Leave <span className="text-red-500">*</span>
            </label>
            <textarea
              id="leave-reason"
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attending a family medical appointment."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={applyMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applyMutation.isPending || reason.trim().length < 5}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 active:scale-[0.98] rounded-xl transition shadow-sm shadow-teal-700/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {applyMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Leave</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
