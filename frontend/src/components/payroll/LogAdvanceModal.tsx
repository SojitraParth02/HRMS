"use client";

import React, { useState } from "react";
import { useEmployeesQuery } from "../../hooks/queries/useEmployees";
import { useLogAdvanceMutation } from "../../hooks/queries/useAdvances";
import { CloseIcon, WarningIcon, CheckIcon, PaymentsIcon } from "../icons";

interface LogAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogAdvanceModal: React.FC<LogAdvanceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const currentMonthYear = new Date().toISOString().slice(0, 7);

  const [userId, setUserId] = useState<string>("");
  const [amount, setAmount] = useState<number>(5000);
  const [monthYear, setMonthYear] = useState<string>(currentMonthYear);
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [reason, setReason] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: employees = [], isLoading: isEmployeesLoading } =
    useEmployeesQuery();
  const logMutation = useLogAdvanceMutation();

  const eligibleEmployees = employees.filter((emp) => emp.role !== "ADMIN");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setErrorMsg("Please select an employee recipient.");
      return;
    }
    if (amount <= 0) {
      setErrorMsg("Advance amount must be greater than zero.");
      return;
    }
    if (!reason.trim()) {
      setErrorMsg("Please provide a reason or note for this advance.");
      return;
    }

    try {
      await logMutation.mutateAsync({
        userId,
        amount: Number(amount),
        monthYear,
        date,
        reason: reason.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to log salary advance.";
      setErrorMsg(msg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <PaymentsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">
                Log Salary Advance
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Record advance payout to be recovered in upcoming payroll
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <WarningIcon className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Employee Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Select Employee <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={isEmployeesLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            >
              <option value="">-- Choose Employee --</option>
              {eligibleEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.username} ({emp.department} • {emp.designation})
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Target Month */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Deduction Cycle (YYYY-MM) <span className="text-rose-500">*</span>
              </label>
              <input
                type="month"
                required
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>
          </div>

          {/* Disbursement Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Disbursement Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Purpose / Reason for Advance <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Medical emergency advance against next month's salary"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={logMutation.isPending || amount <= 0 || !userId}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {logMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>Log Advance</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
