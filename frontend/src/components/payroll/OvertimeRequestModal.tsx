"use client";

import React, { useState } from "react";
import { useSubmitOvertimeMutation } from "../../hooks/queries/useOvertime";
import { CloseIcon, WarningIcon, CheckIcon, AccessTimeIcon } from "../icons";

interface OvertimeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OvertimeRequestModal: React.FC<OvertimeRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState<string>("18:00");
  const [endTime, setEndTime] = useState<string>("20:30");
  const [taskDescription, setTaskDescription] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submitMutation = useSubmitOvertimeMutation();

  if (!isOpen) return null;

  // Auto-calculate hours from start and end times
  const calculateHours = (start: string, end: string): number => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    if (diff <= 0) return 0;
    return Math.round((diff / 60) * 10) / 10;
  };

  const computedHours = calculateHours(startTime, endTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (computedHours <= 0) {
      setErrorMsg("End time must be after start time.");
      return;
    }
    if (!taskDescription.trim() || taskDescription.trim().length < 5) {
      setErrorMsg("Please provide a detailed task description (min 5 characters).");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        date,
        startTime,
        endTime,
        taskDescription: taskDescription.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit overtime request.";
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
              <AccessTimeIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">
                Request Overtime Hours
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Submit extra working hours for HR verification & compensation
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

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Overtime Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          {/* Start and End Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                End Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>
          </div>

          {/* Auto-Calculated Duration Preview */}
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900">
              Computed Overtime Duration:
            </span>
            <span className="text-sm font-black text-teal-800 font-mono">
              {computedHours > 0 ? `${computedHours} Hours` : "Invalid Time Range"}
            </span>
          </div>

          {/* Task Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Task / Work Completed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="e.g. Deployed emergency hotfix for database latency and audited slow queries."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
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
              disabled={submitMutation.isPending || computedHours <= 0}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>Submit Overtime</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
