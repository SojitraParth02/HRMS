"use client";

import React from "react";
import { Employee } from "../../types/employee.types";
import { WarningIcon, CloseIcon } from "../icons";

interface DeactivateConfirmationModalProps {
  isOpen: boolean;
  employee: Employee | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeactivateConfirmationModal: React.FC<DeactivateConfirmationModalProps> = ({
  isOpen,
  employee,
  isPending,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !employee) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivate-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header decoration bar */}
        <div className="h-1.5 w-full bg-linear-to-r from-rose-500 to-amber-500" />

        <div className="p-6">
          {/* Top row: Alert icon and Close button */}
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <WarningIcon className="w-6 h-6 text-rose-600" />
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              aria-label="Close dialog"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Heading & Target Employee Details */}
          <div className="mt-4">
            <h3
              id="deactivate-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              Deactivate Employee?
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Are you sure you want to deactivate{" "}
              <span className="font-semibold text-slate-900">
                {employee.username}
              </span>{" "}
              ({employee.email})?
            </p>
          </div>

          {/* Warning Notice Box */}
          <div className="mt-4 p-3.5 bg-rose-50/70 border border-rose-200/70 rounded-xl">
            <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <span>⚠️</span> Immediate Actions &amp; 30-Day Policy:
            </h4>
            <ul className="mt-1.5 space-y-1 text-[11px] text-rose-800 leading-relaxed list-disc list-inside">
              <li>Active user session will be terminated immediately.</li>
              <li>Employee will be blocked from logging into the portal.</li>
              <li>
                You can reactivate this account within the <strong>30-day grace period</strong>.
              </li>
              <li>
                After 30 days, our midnight background job will <strong>permanently delete</strong> this account.
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] rounded-xl transition shadow-xs shadow-rose-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Deactivating...</span>
                </>
              ) : (
                <span>Confirm Deactivation</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
