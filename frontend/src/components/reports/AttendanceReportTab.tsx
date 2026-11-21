"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAttendanceReportQuery } from "../../hooks/queries/useReports";
import { AttendanceReportRecord } from "../../types/reports.types";
import { ReportSummaryCards, ReportSummaryItem } from "./ReportSummaryCards";
import { ReportFilterBar } from "./ReportFilterBar";
import { exportToCsv, CsvColumn } from "../../utils/csvExport";
import { Pagination } from "../common/Pagination";
import { HighlightText } from "../common/HighlightText";
import { useDebounce } from "../../hooks/useDebounce";
import {
  AccessTimeIcon,
  CheckCircleIcon,
  CancelIcon,
  WarningIcon,
} from "../icons";

export const AttendanceReportTab: React.FC = () => {
  // Default to 1st of current month until today
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  });

  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [department, setDepartment] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, department, debouncedSearch]);

  const { data, isLoading } = useAttendanceReportQuery({
    startDate,
    endDate,
    department: department || undefined,
  });

  const records = data?.records || [];
  const summary = data?.summary;

  // Filter records by client search query
  const filteredRecords = useMemo(() => {
    if (!debouncedSearch.trim()) return records;
    const q = debouncedSearch.toLowerCase().trim();
    return records.filter(
      (r) =>
        r.username.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.designation.toLowerCase().includes(q)
    );
  }, [records, debouncedSearch]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Handle CSV Export
  const handleExportCsv = () => {
    const columns: CsvColumn<AttendanceReportRecord>[] = [
      { header: "Employee Name", accessor: (r) => r.username },
      { header: "Email Address", accessor: (r) => r.email },
      { header: "Department", accessor: (r) => r.department },
      { header: "Designation", accessor: (r) => r.designation },
      { header: "Total Recorded Days", accessor: (r) => r.totalRecordedDays },
      { header: "Days Present", accessor: (r) => r.daysPresent },
      { header: "Days Absent", accessor: (r) => r.daysAbsent },
      { header: "Half-Days Count", accessor: (r) => r.halfDays },
      { header: "Late Arrivals Count", accessor: (r) => r.lateCount },
      { header: "Total Working Minutes", accessor: (r) => r.totalWorkingMinutes },
      { header: "Total Working Hours", accessor: (r) => r.totalWorkingHours },
    ];

    const filename = `attendance_report_${startDate}_to_${endDate}${
      department ? `_${department}` : ""
    }.csv`;

    exportToCsv(filename, columns, filteredRecords);
  };

  const summaryItems: ReportSummaryItem[] = [
    {
      title: "Overall Presence Rate",
      value: `${summary?.overallPresenceRate ?? 0}%`,
      subtitle: "Percentage of logged working days",
      icon: <CheckCircleIcon className="w-5 h-5 text-teal-600" />,
      variant: "teal",
    },
    {
      title: "Total Present Days",
      value: summary?.totalPresentDays ?? 0,
      subtitle: "Full-day workforce attendances",
      icon: <CheckCircleIcon className="w-5 h-5 text-emerald-600" />,
      variant: "emerald",
    },
    {
      title: "Total Absent Days",
      value: summary?.totalAbsentDays ?? 0,
      subtitle: "Unrecorded or missing attendance",
      icon: <CancelIcon className="w-5 h-5 text-rose-600" />,
      variant: "rose",
    },
    {
      title: "Late Arrivals Count",
      value: summary?.totalLateCount ?? 0,
      subtitle: "Punches past 09:30 AM cutoff",
      icon: <WarningIcon className="w-5 h-5 text-amber-600" />,
      variant: "amber",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Summary Metric Cards */}
      <ReportSummaryCards items={summaryItems} />

      {/* 2. Filter Bar */}
      <ReportFilterBar
        mode="dateRange"
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        department={department}
        onDepartmentChange={setDepartment}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onExportCsv={handleExportCsv}
        isExportDisabled={filteredRecords.length === 0}
        totalRecordsCount={filteredRecords.length}
      />

      {/* 3. Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" />
            <span>Aggregating workforce attendance metrics...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <AccessTimeIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              No attendance records found for selected period
            </p>
            <p className="text-xs text-slate-400">
              Adjust your start and end dates or department filter to view workforce attendance logs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-3">Department</th>
                  <th className="py-3.5 px-3 text-center">Total Days</th>
                  <th className="py-3.5 px-3 text-center">Present</th>
                  <th className="py-3.5 px-3 text-center">Absent</th>
                  <th className="py-3.5 px-3 text-center">Half-Days</th>
                  <th className="py-3.5 px-3 text-center">Late Count</th>
                  <th className="py-3.5 px-4 text-right">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedRecords.map((rec) => (
                  <tr
                    key={rec.userId}
                    className="hover:bg-teal-50/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 uppercase text-xs">
                          {rec.username.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            <HighlightText text={rec.username} query={debouncedSearch} />
                          </p>
                          <p className="text-[10px] text-slate-400">
                            <HighlightText text={rec.email} query={debouncedSearch} /> • <HighlightText text={rec.designation} query={debouncedSearch} />
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <HighlightText text={rec.department} query={debouncedSearch} />
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-slate-800 font-mono">
                      {rec.totalRecordedDays}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-emerald-700 font-mono">
                      {rec.daysPresent}
                    </td>

                    <td className="py-3 px-3 text-center font-bold font-mono">
                      {rec.daysAbsent > 0 ? (
                        <span className="text-rose-700">{rec.daysAbsent}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      {rec.halfDays > 0 ? (
                        <span className="text-purple-700 font-bold">
                          {rec.halfDays}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      {rec.lateCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {rec.lateCount} late
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                      {rec.totalWorkingHours} hrs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredRecords.length > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalRecords={filteredRecords.length}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
};
