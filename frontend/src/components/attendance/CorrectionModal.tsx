"use client";

import React, { useState, useEffect } from "react";
import { useSubmitCorrectionMutation } from "../../hooks/queries/useAttendance";
import { AttendanceRecord } from "../../types/attendance.types";
import { CloseIcon, AccessTimeIcon, CancelIcon } from "../icons";

interface CorrectionModalProps {
  isOpen: boolean;
  attendance: AttendanceRecord | null;
  onClose: () => void;
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({
  isOpen,
  attendance,
  onClose,
}) => {
  const submitMutation = useSubmitCorrectionMutation();

  const [hour, setHour] = useState<string>("09");
  const [minute, setMinute] = useState<string>("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [reason, setReason] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && attendance) {
      setHour("09");
      setMinute("00");
      setPeriod("AM");
      setReason("");
      setErrorMessage(null);
    }
  }, [isOpen, attendance]);

  if (!isOpen || !attendance) return null;

  const originalPunchTimeStr = attendance.punchIn
    ? new Date(attendance.punchIn).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Not Recorded";

  const dateStr = new Date(attendance.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMessage(null);

    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMessage("Please enter a valid reason (at least 5 characters).");
      return;
    }

    // Convert 12-hour AM/PM to 24-hour timestamp on the target attendance date
    let h = parseInt(hour, 10);
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    const requestedDate = new Date(attendance.date);
    requestedDate.setHours(h, parseInt(minute, 10), 0, 0);

    try {
      await submitMutation.mutateAsync({
        attendanceId: attendance._id,
        date: attendance.date,
        requestedPunchIn: requestedDate.toISOString(),
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
          "Failed to submit correction request."
      );
    }
  };

  const hoursList = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );
  const minutesList = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700">
              <AccessTimeIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Missed Punch Correction
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Submit actual arrival time for HR approval
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
          {/* Target Date (Read-Only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date
            </label>
            <input
              type="text"
              disabled
              value={dateStr}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600 select-none cursor-not-allowed"
            />
          </div>

          {/* Recorded Punch Time (Read-Only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recorded Arrival Punch{" "}
              <span className="text-slate-400 text-[10px] font-normal">
                (Original)
              </span>
            </label>
            <input
              type="text"
              disabled
              value={originalPunchTimeStr}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-600 select-none cursor-not-allowed"
            />
          </div>

          {/* 12-Hour Dropdown Time Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Actual Arrival Time <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Hour Dropdown */}
              <div>
                <select
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                >
                  {hoursList.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <span className="block text-[10px] text-slate-400 text-center mt-1">
                  Hour
                </span>
              </div>

              {/* Minute Dropdown */}
              <div>
                <select
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                >
                  {minutesList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <span className="block text-[10px] text-slate-400 text-center mt-1">
                  Minute
                </span>
              </div>

              {/* AM / PM Toggle */}
              <div>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setPeriod("AM")}
                    className={`flex-1 py-2 text-xs font-bold transition cursor-pointer ${
                      period === "AM"
                        ? "bg-teal-700 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod("PM")}
                    className={`flex-1 py-2 text-xs font-bold transition cursor-pointer ${
                      period === "PM"
                        ? "bg-teal-700 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    PM
                  </button>
                </div>
                <span className="block text-[10px] text-slate-400 text-center mt-1">
                  Period
                </span>
              </div>
            </div>
          </div>

          {/* Mandatory Reason Field */}
          <div>
            <label
              htmlFor="correction-reason"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Reason for Correction <span className="text-red-500">*</span>
            </label>
            <textarea
              id="correction-reason"
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Arrived on time at 9:00 AM, but was in a morning standup and forgot to punch in until 10:00 AM."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitMutation.isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitMutation.isPending || reason.trim().length < 5}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 active:scale-[0.98] rounded-xl transition shadow-sm shadow-teal-700/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Request</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
