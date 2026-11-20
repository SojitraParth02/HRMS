"use client";

import React, { useState, useEffect } from "react";
import { PayrollData, EmployeeSummary } from "../../types/payroll.types";
import { useAdjustPayrollMutation } from "../../hooks/queries/usePayroll";
import { CloseIcon, WarningIcon, CheckIcon, EditIcon } from "../icons";

interface PayrollAdjustmentModalProps {
  payroll: PayrollData | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PayrollAdjustmentModal: React.FC<PayrollAdjustmentModalProps> = ({
  payroll,
  isOpen,
  onClose,
}) => {
  const [bonus, setBonus] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const adjustMutation = useAdjustPayrollMutation();

  useEffect(() => {
    if (payroll) {
      setBonus(payroll.bonus || 0);
      setOtherDeductions(payroll.otherDeductions || 0);
      setNotes(payroll.notes || "");
      setErrorMsg(null);
    }
  }, [payroll]);

  if (!isOpen || !payroll) return null;

  const employee =
    typeof payroll.userId === "object"
      ? (payroll.userId as EmployeeSummary)
      : null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Live Net Salary calculation
  const gross = payroll.baseSalary + payroll.overtimePay + (Number(bonus) || 0);
  const deductions =
    payroll.lopDeduction +
    payroll.advanceDeduction +
    (Number(otherDeductions) || 0);
  const computedNet = Math.max(0, gross - deductions);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bonus < 0 || otherDeductions < 0) {
      setErrorMsg("Bonus and deductions must be non-negative.");
      return;
    }

    try {
      await adjustMutation.mutateAsync({
        id: payroll._id,
        payload: {
          bonus: Number(bonus),
          otherDeductions: Number(otherDeductions),
          notes,
        },
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update payroll adjustment.";
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
              <EditIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">
                Adjust Draft Payroll
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                {employee?.username || "Employee"} • {payroll.monthYear}
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

          {/* Fixed Metrics Summary */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                Base Salary
              </span>
              <p className="font-bold text-slate-800">{formatCurrency(payroll.baseSalary)}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                OT Pay
              </span>
              <p className="font-bold text-teal-700">+{formatCurrency(payroll.overtimePay)}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                LOP + Advance
              </span>
              <p className="font-bold text-rose-700">
                -{formatCurrency(payroll.lopDeduction + payroll.advanceDeduction)}
              </p>
            </div>
          </div>

          {/* Bonus Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Performance Bonus / Incentive (₹)
            </label>
            <input
              type="number"
              min="0"
              value={bonus}
              onChange={(e) => setBonus(Math.max(0, Number(e.target.value)))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          {/* Other Deductions Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Other Deductions / Tax Recovery (₹)
            </label>
            <input
              type="number"
              min="0"
              value={otherDeductions}
              onChange={(e) => setOtherDeductions(Math.max(0, Number(e.target.value)))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Adjustment Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Q4 performance incentive"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          {/* Live Net Pay Preview */}
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900">
              Recalculated Net Pay:
            </span>
            <span className="text-base font-black text-teal-800 font-mono">
              {formatCurrency(computedNet)}
            </span>
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
              disabled={adjustMutation.isPending}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {adjustMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>Save Adjustments</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
