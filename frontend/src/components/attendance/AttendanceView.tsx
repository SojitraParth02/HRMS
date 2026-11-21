"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAppSelector } from "../../hooks/redux";
import {
  useTodayAttendanceQuery,
  useMyAttendanceHistoryQuery,
  useAllAttendanceRosterQuery,
  useCorrectionsQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useReviewCorrectionMutation,
} from "../../hooks/queries/useAttendance";
import {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceCorrectionRecord,
  TodayAttendanceData,
} from "../../types/attendance.types";
import { CorrectionModal } from "./CorrectionModal";
import { BiometricImportModal } from "./BiometricImportModal";
import { downloadSampleBiometricCSV } from "../../utils/sampleBiometricCSV";
import { Pagination } from "../common/Pagination";
import { HighlightText } from "../common/HighlightText";
import { useDebounce } from "../../hooks/useDebounce";
import {
  AccessTimeIcon,
  CheckCircleIcon,
  CancelIcon,
  WarningIcon,
  CalendarIcon,
  GroupIcon,
  PersonIcon,
  SettingsIcon,
  UploadFileIcon,
  DownloadIcon,
  SearchIcon,
} from "../icons";

const formatTime12h = (dateStr?: string | null): string => {
  if (!dateStr) return "--:--";
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDuration = (totalMinutes?: number): string => {
  if (!totalMinutes || totalMinutes <= 0) return "--";
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h ${mins}m`;
};

const formatLateDuration = (minutes?: number): string => {
  if (!minutes || minutes <= 0) return "0 mins";
  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? "" : "s"}`;
  }
  const hoursDecimal = Math.round((minutes / 60) * 10) / 10;
  return `${hoursDecimal} hr${hoursDecimal === 1 ? "" : "s"}`;
};

export interface AttendanceViewProps {
  initialTodayData?: TodayAttendanceData;
  isLoading?: boolean;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  initialTodayData,
  isLoading: propsIsLoading,
}) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isPrivileged =
    currentUser?.role === "HR" || currentUser?.role === "ADMIN";

  // Real-Time Clock State
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDateStr, setCurrentDateStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Attendance Queries & Mutations
  const { data: queryTodayData, isLoading: queryIsTodayLoading } =
    useTodayAttendanceQuery();
  const todayData = initialTodayData ?? queryTodayData;
  const isTodayLoading = propsIsLoading ?? queryIsTodayLoading;

  // Pagination states for all 3 tables
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyLimit, setHistoryLimit] = useState<number>(10);
  const { data: historyData } = useMyAttendanceHistoryQuery(historyPage, historyLimit);

  // Workforce Roster Filter & Pagination States
  const [rosterDate, setRosterDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [rosterDept, setRosterDept] = useState<string>("");
  const [rosterSearch, setRosterSearch] = useState<string>("");
  const debouncedRosterSearch = useDebounce(rosterSearch, 350);
  const [rosterPage, setRosterPage] = useState<number>(1);
  const [rosterLimit, setRosterLimit] = useState<number>(10);

  // Pending Corrections Pagination States
  const [correctionsPage, setCorrectionsPage] = useState<number>(1);
  const [correctionsLimit, setCorrectionsLimit] = useState<number>(10);

  const { data: correctionsResponse } = useCorrectionsQuery(
    "PENDING",
    isPrivileged,
    correctionsPage,
    correctionsLimit
  );
  const correctionsData = correctionsResponse?.data ?? [];
  const correctionsPagination = correctionsResponse?.pagination;

  const punchInMutation = usePunchInMutation();
  const punchOutMutation = usePunchOutMutation();
  const reviewCorrectionMutation = useReviewCorrectionMutation();

  // Active Tab: "my" | "roster" | "corrections"
  const [activeTab, setActiveTab] = useState<"my" | "roster" | "corrections">(
    "my"
  );

  // Correction Modal State
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] =
    useState<AttendanceRecord | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] =
    useState<boolean>(false);

  // Biometric CSV Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  const { data: rosterResponse, isLoading: isRosterLoading } =
    useAllAttendanceRosterQuery(
      rosterDate,
      rosterDept || undefined,
      isPrivileged && activeTab === "roster",
      rosterPage,
      rosterLimit,
      debouncedRosterSearch
    );
  const rosterData = rosterResponse?.data ?? [];
  const rosterPagination = rosterResponse?.pagination;

  const todayRecord = todayData?.attendance;
  const isPunchedIn = Boolean(todayRecord?.punchIn);
  const isPunchedOut = Boolean(todayRecord?.punchOut);

  const shiftStartDisplay = todayData?.settings?.shiftStartTime ?? "09:00";
  const shiftEndDisplay = todayData?.settings?.shiftEndTime ?? "18:00";
  const graceCutoffDisplay = todayData?.settings?.graceWindowEndTime ?? "09:30";

  const handlePunchClick = async () => {
    if (!isPunchedIn) {
      await punchInMutation.mutateAsync();
    } else if (!isPunchedOut) {
      await punchOutMutation.mutateAsync();
    }
  };

  const handleReviewCorrection = async (
    correctionId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    let rejectionReason: string | undefined = undefined;
    if (status === "REJECTED") {
      const reasonInput = window.prompt(
        "Please enter the reason for rejection (optional):"
      );
      if (reasonInput === null) return; // Cancelled
      rejectionReason = reasonInput.trim() || undefined;
    }

    await reviewCorrectionMutation.mutateAsync({
      id: correctionId,
      payload: { status, rejectionReason },
    });
  };

  const renderStatusBadge = (record: AttendanceRecord) => {
    if (record.isLate) {
      return (
        <div className="flex flex-col gap-0.5">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
            title={`${record.lateMinutes} mins late`}
          >
            <WarningIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Late by {formatLateDuration(record.lateMinutes)}</span>
          </span>
          {record.earlyLeavingMinutes && record.earlyLeavingMinutes > 0 ? (
            <span
              className="text-[10px] text-amber-700 font-semibold pl-1"
              title={`${record.earlyLeavingMinutes} mins early`}
            >
              Left {formatLateDuration(record.earlyLeavingMinutes)} early
            </span>
          ) : null}
        </div>
      );
    }
    if (record.status === "HALF_DAY") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          Half Day
        </span>
      );
    }
    if (record.status === "ABSENT") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Absent
        </span>
      );
    }
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Present</span>
        </span>
        {record.earlyLeavingMinutes && record.earlyLeavingMinutes > 0 ? (
          <span
            className="text-[10px] text-amber-700 font-semibold pl-1"
            title={`${record.earlyLeavingMinutes} mins early`}
          >
            Left {formatLateDuration(record.earlyLeavingMinutes)} early
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-8 py-6 flex-1 space-y-6">
      {/* Page Title & Navigation Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block relative">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Attendance Management
            </h1>
            <div className="w-10 h-[3px] bg-teal-600 rounded-full mt-1" />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Web-based punch in/out, flexible shift tracking & correction requests
          </p>
        </div>

        {/* Header Actions & Live Digital Clock Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isPrivileged && (
            <>
              <button
                type="button"
                onClick={downloadSampleBiometricCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-teal-200/80 bg-white hover:bg-teal-50/50 text-xs font-bold text-teal-800 transition-colors shadow-2xs cursor-pointer"
                title="Download Sample CSV Template"
              >
                <DownloadIcon className="w-4 h-4 text-teal-600" />
                <span className="hidden sm:inline">Sample CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
                title="Upload Biometric Clock CSV"
              >
                <UploadFileIcon className="w-4 h-4 text-white" />
                <span>Import Biometric CSV</span>
              </button>

              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-teal-200/80 bg-white hover:bg-teal-50/50 text-xs font-bold text-teal-800 transition-colors shadow-2xs"
              >
                <SettingsIcon className="w-4 h-4 text-teal-600" />
                <span className="hidden sm:inline">Shift Settings</span>
              </Link>
            </>
          )}

          <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-teal-100 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
              <AccessTimeIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 tracking-tight font-mono">
                {currentTime || "--:--:--"}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">
                {currentDateStr || "Loading..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Primary Punch Action & Shift Compensation Card */}
      <div className="bg-white rounded-2xl p-6 border border-teal-50 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Shift Timing Details */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200/60 rounded-lg text-xs font-bold uppercase tracking-wider">
                Shift: {shiftStartDisplay} – {shiftEndDisplay}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                (Grace window until {graceCutoffDisplay})
              </span>
            </div>

            {/* Shift Real-Time Status Banner */}
            {!isPunchedIn ? (
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                You haven&apos;t punched in yet today. Click the button to start
                your work day.
              </p>
            ) : todayRecord?.isLate ? (
              <div className="flex items-start gap-2 text-rose-700 bg-rose-50/80 border border-rose-200/80 p-3 rounded-xl max-w-xl">
                <WarningIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold">
                    Late Arrival at {formatTime12h(todayRecord.punchIn)}:
                  </span>{" "}
                  You are late by {formatLateDuration(todayRecord.lateMinutes)}
                  {todayRecord.lateMinutes >= 60 ? ` (${todayRecord.lateMinutes} mins)` : ""}{" "}
                  (grace cutoff was {graceCutoffDisplay}).
                  {todayRecord.isCorrected && (
                    <span className="ml-1 text-emerald-700 font-semibold">
                      (Correction Approved)
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-teal-800 bg-teal-50/70 border border-teal-200/80 p-3 rounded-xl max-w-xl">
                <CheckCircleIcon className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold">
                    Punched in at {formatTime12h(todayRecord?.punchIn)}
                  </span>{" "}
                  {todayRecord?.flexMinutesOwed &&
                  todayRecord.flexMinutesOwed > 0 ? (
                    <span>
                      • Grace flex owed: {todayRecord.flexMinutesOwed}m.{" "}
                      <span className="font-bold text-teal-900">
                        Target evening departure:{" "}
                        {formatTime12h(todayRecord.expectedPunchOut)}
                      </span>
                    </span>
                  ) : (
                    <span>• On-time arrival. Regular departure at {shiftEndDisplay}.</span>
                  )}
                </div>
              </div>
            )}

            {/* Completed Work Duration if Punched Out */}
            {isPunchedOut && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>
                    Work day completed! Total duration:{" "}
                    {formatDuration(todayRecord?.totalWorkingMinutes)} (Punched out
                    at {formatTime12h(todayRecord?.punchOut)})
                  </span>
                </p>
                {todayRecord?.earlyLeavingMinutes && todayRecord.earlyLeavingMinutes > 0 ? (
                  <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                    <WarningIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Departed early by {formatLateDuration(todayRecord.earlyLeavingMinutes)}
                      {todayRecord.earlyLeavingMinutes >= 60 ? ` (${todayRecord.earlyLeavingMinutes} mins)` : ""}{" "}
                      (expected departure was {formatTime12h(todayRecord.expectedPunchOut)}).
                    </span>
                  </p>
                ) : null}
              </div>
            )}
          </div>

          {/* Large Punch Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={
                isTodayLoading ||
                isPunchedOut ||
                punchInMutation.isPending ||
                punchOutMutation.isPending
              }
              onClick={handlePunchClick}
              className={`px-8 py-3.5 rounded-2xl font-black text-sm tracking-wide shadow-md transition-all cursor-pointer flex items-center gap-3 select-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                !isPunchedIn
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                  : !isPunchedOut
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 animate-pulse"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed shadow-none"
              }`}
            >
              <AccessTimeIcon className="w-5 h-5" />
              <span>
                {punchInMutation.isPending
                  ? "Recording Punch..."
                  : punchOutMutation.isPending
                  ? "Recording Departure..."
                  : !isPunchedIn
                  ? "PUNCH IN"
                  : !isPunchedOut
                  ? "PUNCH OUT"
                  : "DAY COMPLETED"}
              </span>
            </button>

            {/* Quick Missed Punch Request Button if Punched In */}
            {isPunchedIn && todayRecord && (
              <button
                type="button"
                onClick={() => {
                  setSelectedRecordForCorrection(todayRecord);
                  setIsCorrectionModalOpen(true);
                }}
                className="px-4 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                Request Correction
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs (My Attendance / Workforce Roster / Pending Corrections) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("my")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
            activeTab === "my"
              ? "bg-teal-700 text-white shadow-sm shadow-teal-700/20"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <PersonIcon className="w-4 h-4" />
          <span>My Attendance</span>
        </button>

        {isPrivileged && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab("roster")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
                activeTab === "roster"
                  ? "bg-teal-700 text-white shadow-sm shadow-teal-700/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <GroupIcon className="w-4 h-4" />
              <span>Workforce Roster</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("corrections")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
                activeTab === "corrections"
                  ? "bg-teal-700 text-white shadow-sm shadow-teal-700/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <AccessTimeIcon className="w-4 h-4" />
              <span>Pending Corrections</span>
              {correctionsPagination && correctionsPagination.totalRecords > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                  {correctionsPagination.totalRecords}
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* Tab Content 1: My Personal Attendance History */}
      {activeTab === "my" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              Personal Attendance History
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total Records: {historyData?.pagination?.totalRecords ?? 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Arrival (In)</th>
                  <th className="px-4 py-3">Departure (Out)</th>
                  <th className="px-4 py-3">Effective Work Hours</th>
                  <th className="px-4 py-3">Daily Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!historyData?.data || historyData.data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No attendance history records found.
                    </td>
                  </tr>
                ) : (
                  historyData.data.map((rec) => (
                    <tr
                      key={rec._id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {new Date(rec.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatTime12h(rec.punchIn)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatTime12h(rec.punchOut)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {formatDuration(rec.totalWorkingMinutes)}
                      </td>
                      <td className="px-4 py-3">{renderStatusBadge(rec)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecordForCorrection(rec);
                            setIsCorrectionModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition cursor-pointer"
                        >
                          Request Correction
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={historyData?.pagination?.currentPage || historyPage}
            pageSize={historyData?.pagination?.pageSize || historyLimit}
            totalRecords={historyData?.pagination?.totalRecords || 0}
            totalPages={historyData?.pagination?.totalPages || 1}
            onPageChange={(p) => setHistoryPage(p)}
            onPageSizeChange={(s) => {
              setHistoryLimit(s);
              setHistoryPage(1);
            }}
          />
        </div>
      )}

      {/* Tab Content 2: Workforce Roster (HR / Admin View) */}
      {activeTab === "roster" && isPrivileged && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-4 p-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Select Date
                </label>
                <input
                  type="date"
                  value={rosterDate}
                  onChange={(e) => {
                    setRosterDate(e.target.value);
                    setRosterPage(1);
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Department
                </label>
                <select
                  value={rosterDept}
                  onChange={(e) => {
                    setRosterDept(e.target.value);
                    setRosterPage(1);
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                >
                  <option value="">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                  Search Employee
                </label>
                <div className="relative w-full sm:w-56">
                  <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => {
                      setRosterSearch(e.target.value);
                      setRosterPage(1);
                    }}
                    placeholder="Search roster..."
                    className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <span className="text-xs text-slate-500 font-semibold">
              Employees Logged: {rosterPagination?.totalRecords ?? 0}
            </span>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Punch In</th>
                  <th className="px-4 py-3">Punch Out</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isRosterLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Loading daily roster...
                    </td>
                  </tr>
                ) : !rosterData || rosterData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No attendance records for the selected date.
                    </td>
                  </tr>
                ) : (
                  rosterData.map((rec) => {
                    const emp =
                      typeof rec.userId === "object" ? rec.userId : null;
                    return (
                      <tr
                        key={rec._id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div>
                            <p>
                              <HighlightText
                                text={emp?.username ?? "Unknown Employee"}
                                query={debouncedRosterSearch}
                              />
                            </p>
                            <p className="text-[10px] text-slate-400 font-normal">
                              <HighlightText
                                text={emp?.email ?? ""}
                                query={debouncedRosterSearch}
                              />
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <HighlightText
                            text={emp?.department ?? "--"}
                            query={debouncedRosterSearch}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {formatTime12h(rec.punchIn)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {formatTime12h(rec.punchOut)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {formatDuration(rec.totalWorkingMinutes)}
                        </td>
                        <td className="px-4 py-3">{renderStatusBadge(rec)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={rosterPagination?.currentPage || rosterPage}
            pageSize={rosterPagination?.pageSize || rosterLimit}
            totalRecords={rosterPagination?.totalRecords || 0}
            totalPages={rosterPagination?.totalPages || 1}
            onPageChange={(p) => setRosterPage(p)}
            onPageSizeChange={(s) => {
              setRosterLimit(s);
              setRosterPage(1);
            }}
          />
        </div>
      )}

      {/* Tab Content 3: Pending Corrections (HR / Admin Review) */}
      {activeTab === "corrections" && isPrivileged && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              Pending Missed Punch Correction Requests
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Queue: {correctionsPagination?.totalRecords ?? 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Target Date</th>
                  <th className="px-4 py-3">Original Punch</th>
                  <th className="px-4 py-3">Requested Arrival</th>
                  <th className="px-4 py-3">Reason Provided</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!correctionsData || correctionsData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No pending correction requests.
                    </td>
                  </tr>
                ) : (
                  correctionsData.map((corr) => {
                    const emp =
                      typeof corr.userId === "object" ? corr.userId : null;
                    return (
                      <tr
                        key={corr._id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div>
                            <p>{emp?.username ?? "Unknown"}</p>
                            <p className="text-[10px] text-slate-400 font-normal">
                              {emp?.email ?? ""}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {new Date(corr.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-slate-500 line-through">
                          {formatTime12h(corr.originalPunchIn)}
                        </td>
                        <td className="px-4 py-3 font-bold text-teal-700">
                          {formatTime12h(corr.requestedPunchIn)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          {corr.reason}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleReviewCorrection(corr._id, "APPROVED")
                              }
                              disabled={reviewCorrectionMutation.isPending}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleReviewCorrection(corr._id, "REJECTED")
                              }
                              disabled={reviewCorrectionMutation.isPending}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={correctionsPagination?.currentPage || correctionsPage}
            pageSize={correctionsPagination?.pageSize || correctionsLimit}
            totalRecords={correctionsPagination?.totalRecords || 0}
            totalPages={correctionsPagination?.totalPages || 1}
            onPageChange={(p) => setCorrectionsPage(p)}
            onPageSizeChange={(s) => {
              setCorrectionsLimit(s);
              setCorrectionsPage(1);
            }}
          />
        </div>
      )}

      {/* Missed Punch Correction Modal */}
      <CorrectionModal
        isOpen={isCorrectionModalOpen}
        attendance={selectedRecordForCorrection}
        onClose={() => {
          setIsCorrectionModalOpen(false);
          setSelectedRecordForCorrection(null);
        }}
      />

      {/* Biometric CSV Import Modal */}
      <BiometricImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
