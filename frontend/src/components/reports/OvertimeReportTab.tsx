"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useOvertimeReportQuery } from "../../hooks/queries/useReports";
import { OvertimeReportRecord } from "../../types/reports.types";
import { ReportSummaryCards, ReportSummaryItem } from "./ReportSummaryCards";
import { ReportFilterBar } from "./ReportFilterBar";
import { exportToCsv, CsvColumn } from "../../utils/csvExport";
import { Pagination } from "../common/Pagination";
import { HighlightText } from "../common/HighlightText";
import { useDebounce } from "../../hooks/useDebounce";
import {
  AccessTimeIcon,
  PaymentsIcon,
  GroupIcon,
  BarChartIcon,
} from "../icons";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const OvertimeReportTab: React.FC = () => {
  // Default to current month YYYY-MM
  const [monthYear, setMonthYear] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  });

  const [department, setDepartment] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearch = useDebounce(searchQuery, 350);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [monthYear, department, debouncedSearch]);

  const { data, isLoading } = useOvertimeReportQuery({
    monthYear,
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
    const columns: CsvColumn<OvertimeReportRecord>[] = [
      { header: "Employee Name", accessor: (r) => r.username },
      { header: "Email Address", accessor: (r) => r.email },
      { header: "Department", accessor: (r) => r.department },
      { header: "Designation", accessor: (r) => r.designation },
      { header: "Approved OT Submissions", accessor: (r) => r.submissionsCount },
      { header: "Total Approved OT Hours", accessor: (r) => r.approvedHours },
      { header: "Monthly Base Salary (INR)", accessor: (r) => r.monthlySalary },
      { header: "Base Hourly Rate (INR)", accessor: (r) => r.hourlyRate },
      { header: "1.5x OT Hourly Rate (INR)", accessor: (r) => r.otRate },
      { header: "Total Certified OT Pay (INR)", accessor: (r) => r.totalOtPay },
    ];

    const filename = `overtime_utilization_report_${monthYear}${
      department ? `_${department}` : ""
    }.csv`;

    exportToCsv(filename, columns, filteredRecords);
  };

  const summaryItems: ReportSummaryItem[] = [
    {
      title: "Total Approved OT Hours",
      value: `${summary?.totalApprovedHours ?? 0} hrs`,
      subtitle: "Verified by managers & HR",
      icon: <AccessTimeIcon className="w-5 h-5 text-teal-600" />,
      variant: "teal",
    },
    {
      title: "Total Certified OT Payout",
      value: formatCurrency(summary?.totalOtPayout ?? 0),
      subtitle: "Statutory 1.5x multiplier applied",
      icon: <PaymentsIcon className="w-5 h-5 text-emerald-600" />,
      variant: "emerald",
    },
    {
      title: "Participating Workforce",
      value: `${summary?.uniqueEmployeesCount ?? 0} employees`,
      subtitle: "Submitted approved overtime",
      icon: <GroupIcon className="w-5 h-5 text-indigo-600" />,
      variant: "indigo",
    },
    {
      title: "Average OT / Participant",
      value: `${summary?.averageHoursPerEmployee ?? 0} hrs`,
      subtitle: "Per-employee overtime load",
      icon: <BarChartIcon className="w-5 h-5 text-amber-600" />,
      variant: "amber",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Summary Metric Cards */}
      <ReportSummaryCards items={summaryItems} />

      {/* 2. Filter Bar */}
      <ReportFilterBar
        mode="monthYear"
        monthYear={monthYear}
        onMonthYearChange={setMonthYear}
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
            <span>Aggregating workforce overtime logs...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <AccessTimeIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              No approved overtime records found for {monthYear}
            </p>
            <p className="text-xs text-slate-400">
              Either no overtime was submitted or approved requests have not been certified for this cycle.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-3">Department</th>
                  <th className="py-3.5 px-3 text-center">Requests</th>
                  <th className="py-3.5 px-3 text-center">Approved Hours</th>
                  <th className="py-3.5 px-3 text-right">Base Hourly Rate</th>
                  <th className="py-3.5 px-3 text-right">1.5x OT Rate</th>
                  <th className="py-3.5 px-4 text-right">Total OT Pay</th>
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

                    <td className="py-3 px-3 text-center font-mono text-slate-700">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {rec.submissionsCount} req
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-bold font-mono text-teal-800">
                      {rec.approvedHours} hrs
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {formatCurrency(rec.hourlyRate)}/hr
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold">
                      {formatCurrency(rec.otRate)}/hr
                    </td>

                    <td className="py-3 px-4 text-right font-black text-slate-900 font-mono text-sm">
                      {formatCurrency(rec.totalOtPay)}
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
