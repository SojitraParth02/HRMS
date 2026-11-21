"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePayrollReportQuery } from "../../hooks/queries/useReports";
import { PayrollReportRecord } from "../../types/reports.types";
import { ReportSummaryCards, ReportSummaryItem } from "./ReportSummaryCards";
import { ReportFilterBar } from "./ReportFilterBar";
import { exportToCsv, CsvColumn } from "../../utils/csvExport";
import { Pagination } from "../common/Pagination";
import { HighlightText } from "../common/HighlightText";
import { useDebounce } from "../../hooks/useDebounce";
import {
  PaymentsIcon,
  ReceiptLongIcon,
  CheckCircleIcon,
  WarningIcon,
} from "../icons";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const PayrollReportTab: React.FC = () => {
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

  const { data, isLoading } = usePayrollReportQuery({
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
        r.designation.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
    );
  }, [records, debouncedSearch]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Handle CSV Export
  const handleExportCsv = () => {
    const columns: CsvColumn<PayrollReportRecord>[] = [
      { header: "Employee Name", accessor: (r) => r.username },
      { header: "Email Address", accessor: (r) => r.email },
      { header: "Department", accessor: (r) => r.department },
      { header: "Designation", accessor: (r) => r.designation },
      { header: "Base Salary (INR)", accessor: (r) => r.baseSalary },
      { header: "LOP Days Count", accessor: (r) => r.lopDaysCount },
      { header: "LOP Deduction (INR)", accessor: (r) => r.lopDeduction },
      { header: "Overtime Hours", accessor: (r) => r.overtimeHours },
      { header: "Overtime Pay (INR)", accessor: (r) => r.overtimePay },
      { header: "Advance Recovery (INR)", accessor: (r) => r.advanceDeduction },
      { header: "Bonus (INR)", accessor: (r) => r.bonus },
      { header: "Net Salary (INR)", accessor: (r) => r.netSalary },
      { header: "Payment Status", accessor: (r) => r.status },
      { header: "Paid", accessor: (r) => (r.isPaid ? "YES" : "NO") },
      { header: "Paid At", accessor: (r) => r.paidAt || "N/A" },
      { header: "Payment Method", accessor: (r) => r.paymentMethod || "N/A" },
      { header: "Reference / Transaction ID", accessor: (r) => r.transactionReference || "N/A" },
    ];

    const filename = `payroll_expenditure_report_${monthYear}${
      department ? `_${department}` : ""
    }.csv`;

    exportToCsv(filename, columns, filteredRecords);
  };

  const summaryItems: ReportSummaryItem[] = [
    {
      title: "Gross Monthly Budget",
      value: formatCurrency(summary?.totalGrossBudget ?? 0),
      subtitle: `${summary?.totalEmployees ?? 0} active employees budgeted`,
      icon: <PaymentsIcon className="w-5 h-5 text-teal-600" />,
      variant: "teal",
    },
    {
      title: "Total LOP Deductions",
      value: formatCurrency(summary?.totalLopDeductions ?? 0),
      subtitle: "Unpaid absence / statutory 26-day deductions",
      icon: <WarningIcon className="w-5 h-5 text-amber-600" />,
      variant: "amber",
    },
    {
      title: "Total Advance Deductions",
      value: formatCurrency(summary?.totalAdvanceDeductions ?? 0),
      subtitle: "Recovered salary advances",
      icon: <ReceiptLongIcon className="w-5 h-5 text-indigo-600" />,
      variant: "indigo",
    },
    {
      title: "Total Net Disbursed",
      value: formatCurrency(summary?.totalNetDisbursed ?? 0),
      subtitle: `${summary?.totalPaidCount ?? 0} paid, ${
        summary?.totalUnpaidCount ?? 0
      } pending`,
      icon: <CheckCircleIcon className="w-5 h-5 text-emerald-600" />,
      variant: "emerald",
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
            <span>Aggregating payroll expenditure records...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <ReceiptLongIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              No payroll statements found for {monthYear}
            </p>
            <p className="text-xs text-slate-400">
              Select another cycle or run the payroll draft in the Payroll module.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-3">Department</th>
                  <th className="py-3.5 px-3 text-right">Base Salary</th>
                  <th className="py-3.5 px-3 text-right">LOP Ded.</th>
                  <th className="py-3.5 px-3 text-right">OT Pay</th>
                  <th className="py-3.5 px-3 text-right">Advance Ded.</th>
                  <th className="py-3.5 px-3 text-right">Bonus</th>
                  <th className="py-3.5 px-4 text-right">Net Salary</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedRecords.map((rec) => (
                  <tr
                    key={rec.payrollId}
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

                    <td className="py-3 px-3 text-right font-mono text-slate-800">
                      {formatCurrency(rec.baseSalary)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      {rec.lopDeduction > 0 ? (
                        <span className="text-rose-600">
                          -{formatCurrency(rec.lopDeduction)}
                          <span className="block text-[9px] text-rose-400">
                            ({rec.lopDaysCount}d)
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      {rec.overtimePay > 0 ? (
                        <span className="text-emerald-700 font-semibold">
                          +{formatCurrency(rec.overtimePay)}
                          <span className="block text-[9px] text-emerald-600">
                            ({rec.overtimeHours}h)
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      {rec.advanceDeduction > 0 ? (
                        <span className="text-amber-700">
                          -{formatCurrency(rec.advanceDeduction)}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      {rec.bonus > 0 ? (
                        <span className="text-teal-700 font-semibold">
                          +{formatCurrency(rec.bonus)}
                        </span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-black text-slate-900 font-mono text-sm">
                      {formatCurrency(rec.netSalary)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {rec.isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                          PAID
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          {rec.status}
                        </span>
                      )}
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
