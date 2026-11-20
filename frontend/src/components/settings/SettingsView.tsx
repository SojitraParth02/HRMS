"use client";

import React, { useState, useEffect } from "react";
import { useAppSelector } from "../../hooks/redux";
import {
  useCompanySettingsQuery,
  useUpdateCompanySettingsMutation,
} from "../../hooks/queries/useSettings";
import {
  SettingsIcon,
  AccessTimeIcon,
  LeavesIcon,
  CheckCircleIcon,
  WarningIcon,
  InfoIcon,
  RestartAltIcon,
  CheckIcon,
} from "../icons";

export const SettingsView: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isPrivileged =
    currentUser?.role === "HR" || currentUser?.role === "ADMIN";

  const { data: settings, isLoading, isError } = useCompanySettingsQuery();
  const updateMutation = useUpdateCompanySettingsMutation();

  // Form State
  const [shiftStartTime, setShiftStartTime] = useState<string>("09:00");
  const [shiftEndTime, setShiftEndTime] = useState<string>("18:00");
  const [graceWindowEndTime, setGraceWindowEndTime] = useState<string>("09:30");
  const [standardWorkHoursPerDay, setStandardWorkHoursPerDay] =
    useState<number>(8);
  const [lunchStartTime, setLunchStartTime] = useState<string>("12:00");
  const [lunchEndTime, setLunchEndTime] = useState<string>("13:00");
  const [yearlyPaidLeaveQuota, setYearlyPaidLeaveQuota] = useState<number>(5);

  const [notificationMsg, setNotificationMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Sync form state when server settings are loaded
  useEffect(() => {
    if (settings) {
      setShiftStartTime(settings.shiftStartTime || "09:00");
      setShiftEndTime(settings.shiftEndTime || "18:00");
      setGraceWindowEndTime(settings.graceWindowEndTime || "09:30");
      setStandardWorkHoursPerDay(settings.standardWorkHoursPerDay ?? 8);
      setLunchStartTime(settings.lunchStartTime || "12:00");
      setLunchEndTime(settings.lunchEndTime || "13:00");
      setYearlyPaidLeaveQuota(settings.yearlyPaidLeaveQuota ?? 5);
    }
  }, [settings]);

  const handleReset = () => {
    if (settings) {
      setShiftStartTime(settings.shiftStartTime || "09:00");
      setShiftEndTime(settings.shiftEndTime || "18:00");
      setGraceWindowEndTime(settings.graceWindowEndTime || "09:30");
      setStandardWorkHoursPerDay(settings.standardWorkHoursPerDay ?? 8);
      setLunchStartTime(settings.lunchStartTime || "12:00");
      setLunchEndTime(settings.lunchEndTime || "13:00");
      setYearlyPaidLeaveQuota(settings.yearlyPaidLeaveQuota ?? 5);
      setNotificationMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPrivileged) return;

    if (graceWindowEndTime <= shiftStartTime) {
      setNotificationMsg({
        type: "error",
        text: "Grace window cutoff time must be after the shift start time.",
      });
      return;
    }

    if (shiftEndTime <= shiftStartTime) {
      setNotificationMsg({
        type: "error",
        text: "Shift end time must be after the shift start time.",
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        shiftStartTime,
        shiftEndTime,
        graceWindowEndTime,
        standardWorkHoursPerDay: Number(standardWorkHoursPerDay),
        lunchStartTime,
        lunchEndTime,
        yearlyPaidLeaveQuota: Number(yearlyPaidLeaveQuota),
      });

      setNotificationMsg({
        type: "success",
        text: "Company settings updated successfully! Shift rules & leave quotas are now live.",
      });
      setTimeout(() => setNotificationMsg(null), 5000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update company settings.";
      setNotificationMsg({
        type: "error",
        text: message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 font-medium">
            Loading company configuration...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-800 space-y-2">
          <WarningIcon className="w-8 h-8 text-rose-600 mx-auto" />
          <h3 className="text-sm font-bold">Failed to load company settings</h3>
          <p className="text-xs text-rose-600">
            Please refresh the page or verify backend connectivity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 py-6 flex-1 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block relative">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Company Configuration & Shift Rules
            </h1>
            <div className="w-10 h-[3px] bg-teal-600 rounded-full mt-1" />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Global shift timings, flex grace window, lunch breaks & annual paid leave quotas
          </p>
        </div>

        {/* Access Role Badge */}
        <div className="flex items-center gap-2">
          {isPrivileged ? (
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold inline-flex items-center gap-1.5">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
              HR / Admin Permissions Active
            </span>
          ) : (
            <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
              <InfoIcon className="w-3.5 h-3.5 text-slate-500" />
              Employee View (Read-Only)
            </span>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notificationMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 ${
            notificationMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationMsg.type === "success" ? (
              <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <WarningIcon className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificationMsg(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Shift & Grace Period Configuration */}
        <div className="bg-white rounded-2xl border border-teal-50/80 shadow-2xs p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
              <AccessTimeIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Office Shift & Grace Window
              </h2>
              <p className="text-xs text-slate-500">
                Configure official start, evening departure, and flex arrival threshold
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Shift Start */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Shift Start Time
              </label>
              <input
                type="time"
                value={shiftStartTime}
                disabled={!isPrivileged}
                onChange={(e) => setShiftStartTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <p className="text-[11px] text-slate-400">
                Standard reporting time (e.g. 09:00 AM)
              </p>
            </div>

            {/* Grace Window Cutoff */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Grace Period Cutoff
              </label>
              <input
                type="time"
                value={graceWindowEndTime}
                disabled={!isPrivileged}
                onChange={(e) => setGraceWindowEndTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <p className="text-[11px] text-amber-600 font-medium">
                Flex window cutoff (arrivals after this are Late)
              </p>
            </div>

            {/* Shift End */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Shift End Time
              </label>
              <input
                type="time"
                value={shiftEndTime}
                disabled={!isPrivileged}
                onChange={(e) => setShiftEndTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <p className="text-[11px] text-slate-400">
                Standard evening punch-out target (e.g. 18:00)
              </p>
            </div>
          </div>

          {/* Logic Explanation Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <InfoIcon className="w-4 h-4 text-teal-600" />
              How Flex Compensation & Late Logic Work:
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 leading-relaxed">
              <li>
                <strong>Arrival between {shiftStartTime} and {graceWindowEndTime}:</strong> Employee is <em>On Time</em>, but owes morning flex compensation in the evening (e.g. 9:15 AM arrival $\to$ punch out at 6:15 PM).
              </li>
              <li>
                <strong>Arrival after {graceWindowEndTime}:</strong> Employee is strictly flagged as <strong>LATE</strong>. Late minutes are calculated strictly from the grace cutoff ({graceWindowEndTime}), and evening target is shifted to the maximum compensated time.
              </li>
              <li>
                <strong>Early Departure:</strong> If an employee punches out before their expected evening departure, early leaving minutes are recorded.
              </li>
            </ul>
          </div>
        </div>

        {/* Card 2: Lunch Break & Working Hours */}
        <div className="bg-white rounded-2xl border border-teal-50/80 shadow-2xs p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Lunch Break & Daily Target Hours
              </h2>
              <p className="text-xs text-slate-500">
                Specify mandatory lunch duration and daily working hours expectation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Lunch Start */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Lunch Start Time
              </label>
              <input
                type="time"
                value={lunchStartTime}
                disabled={!isPrivileged}
                onChange={(e) => setLunchStartTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <p className="text-[11px] text-slate-400">Default: 12:00 PM</p>
            </div>

            {/* Lunch End */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Lunch End Time
              </label>
              <input
                type="time"
                value={lunchEndTime}
                disabled={!isPrivileged}
                onChange={(e) => setLunchEndTime(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <p className="text-[11px] text-slate-400">Default: 01:00 PM (60 min break)</p>
            </div>

            {/* Standard Work Hours */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Standard Work Hours / Day
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={standardWorkHoursPerDay}
                disabled={!isPrivileged}
                onChange={(e) => setStandardWorkHoursPerDay(Number(e.target.value))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <p className="text-[11px] text-slate-400">Excludes lunch break (e.g. 8 hours)</p>
            </div>
          </div>
        </div>

        {/* Card 3: Yearly Paid Leave Quota */}
        <div className="bg-white rounded-2xl border border-teal-50/80 shadow-2xs p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
              <LeavesIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Leave Policy & Paid Quota
              </h2>
              <p className="text-xs text-slate-500">
                Define the annual paid leave allocation provided to each employee
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Yearly Paid Leave Quota (Days)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={yearlyPaidLeaveQuota}
                  disabled={!isPrivileged}
                  onChange={(e) => setYearlyPaidLeaveQuota(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 disabled:bg-slate-50 disabled:text-slate-400"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Days / Year
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Company standard allocation (default: 5 days)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100 text-xs text-teal-900 space-y-1 flex flex-col justify-center">
              <span className="font-bold flex items-center gap-1.5 text-teal-800">
                <CheckCircleIcon className="w-4 h-4 text-teal-600" />
                Automated Loss of Pay (LOP) Protection:
              </span>
              <p className="text-teal-700 leading-relaxed text-[11px]">
                Once an employee exhausts their {yearlyPaidLeaveQuota} paid days in the calendar year, any subsequent leaves are automatically designated as Loss of Pay (LOP) for payroll processing.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons for HR / Admin */}
        {isPrivileged && (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={updateMutation.isPending}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RestartAltIcon className="w-4 h-4" />
              Reset Changes
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold tracking-wide transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
