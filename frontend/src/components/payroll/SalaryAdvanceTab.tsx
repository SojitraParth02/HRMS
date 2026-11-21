"use client";

import React, { useState } from "react";
import { useAppSelector } from "../../hooks/redux";
import {
  useAdvancesQuery,
  useMyAdvancesQuery,
} from "../../hooks/queries/useAdvances";
import {
  SalaryAdvanceData,
  EmployeeSummary,
} from "../../types/payroll.types";
import { LogAdvanceModal } from "./LogAdvanceModal";
import { Pagination } from "../common/Pagination";
import { HighlightText } from "../common/HighlightText";
import { useDebounce } from "../../hooks/useDebounce";
import {
  PaymentsIcon,
  CheckCircleIcon,
  WarningIcon,
  AddIcon,
  SearchIcon,
} from "../icons";

export const SalaryAdvanceTab: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isPrivileged =
    currentUser?.role === "HR" || currentUser?.role === "ADMIN";

  const currentMonthYear = new Date().toISOString().slice(0, 7);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>(currentMonthYear);
  const [advSearch, setAdvSearch] = useState<string>("");
  const debouncedAdvSearch = useDebounce(advSearch, 350);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Queries
  const { data: allData, isLoading: isAllLoading } = useAdvancesQuery(
    {
      monthYear: selectedMonthYear || undefined,
      search: debouncedAdvSearch || undefined,
      page,
      limit,
    },
    isPrivileged
  );

  const { data: myData, isLoading: isMyLoading } = useMyAdvancesQuery(page, limit);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const recordsToDisplay = isPrivileged
    ? allData?.data || []
    : myData?.data || [];
  const pagination = isPrivileged ? allData?.pagination : myData?.pagination;
  const isLoading = isPrivileged ? isAllLoading : isMyLoading;

  const totalAdvanceAmount = recordsToDisplay.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-teal-50 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight">
            Salary Advances Ledger
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Mid-month salary disbursements automatically deducted in monthly payroll runs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isPrivileged && (
            <div className="relative w-full sm:w-56">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={advSearch}
                onChange={(e) => {
                  setAdvSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search advances..."
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
          )}

          {isPrivileged && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Month:</label>
              <input
                type="month"
                value={selectedMonthYear}
                onChange={(e) => {
                  setSelectedMonthYear(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
          )}

          {isPrivileged && (
            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <AddIcon className="w-4 h-4" />
              <span>Log Advance</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Card */}
      {recordsToDisplay.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-teal-50 shadow-2xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Advances Logged
            </span>
            <p className="text-base font-black text-slate-800 mt-0.5">
              {recordsToDisplay.length}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Sum Disbursed
            </span>
            <p className="text-base font-black text-rose-700 mt-0.5">
              {formatCurrency(totalAdvanceAmount)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Recovery Status
            </span>
            <p className="text-xs font-bold text-slate-600 mt-1">
              Auto-deducted on Finalize
            </p>
          </div>
        </div>
      )}

      {/* Advances Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading advance records...</div>
        ) : recordsToDisplay.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-1">
            <PaymentsIcon className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-600">No salary advances recorded.</p>
            <p className="text-[11px] text-slate-400">
              {isPrivileged
                ? "Click 'Log Advance' above to issue a mid-month payout to an employee."
                : "You have no active or historical salary advances."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {isPrivileged && <th className="py-3 px-4">Employee</th>}
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Deduction Cycle</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-3">Deduction Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recordsToDisplay.map((adv) => {
                  const emp =
                    typeof adv.userId === "object"
                      ? (adv.userId as EmployeeSummary)
                      : null;

                  return (
                    <tr key={adv._id} className="hover:bg-teal-50/20">
                      {isPrivileged && (
                        <td className="py-3 px-4 font-bold text-slate-800">
                          <HighlightText
                            text={emp?.username || "Employee"}
                            query={debouncedAdvSearch}
                          />
                        </td>
                      )}
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(adv.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">
                        {adv.monthYear}
                      </td>
                      <td className="py-3 px-3 font-black text-rose-700 font-mono">
                        {formatCurrency(adv.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm truncate" title={adv.reason}>
                        {adv.reason}
                      </td>
                      <td className="py-3 px-3">
                        {adv.isDeducted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                            Deducted in Payroll
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <WarningIcon className="w-3 h-3 text-amber-600" />
                            Scheduled for Deduction
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={pagination?.currentPage || page}
          pageSize={pagination?.pageSize || limit}
          totalRecords={pagination?.totalRecords || 0}
          totalPages={pagination?.totalPages || 1}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setLimit(s);
            setPage(1);
          }}
        />
      </div>

      {/* Log Advance Modal */}
      <LogAdvanceModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
      />
    </div>
  );
};
