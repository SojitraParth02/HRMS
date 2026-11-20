"use client";

import React, { useState } from "react";
import { useAppSelector } from "../../hooks/redux";
import {
  useMyOvertimeQuery,
  useAllOvertimeQuery,
  useReviewOvertimeMutation,
} from "../../hooks/queries/useOvertime";
import {
  OvertimeRequestData,
  OvertimeStatus,
  EmployeeSummary,
} from "../../types/payroll.types";
import { OvertimeRequestModal } from "./OvertimeRequestModal";
import {
  AccessTimeIcon,
  CheckCircleIcon,
  CancelIcon,
  WarningIcon,
  AddIcon,
  FilterListIcon,
} from "../icons";

export const OvertimeManagementTab: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isPrivileged =
    currentUser?.role === "HR" || currentUser?.role === "ADMIN";

  const [statusFilter, setStatusFilter] = useState<OvertimeStatus | "ALL">("ALL");
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);

  // Queries
  const { data: myData, isLoading: isMyLoading } = useMyOvertimeQuery(1, 50);
  const { data: allData, isLoading: isAllLoading } = useAllOvertimeQuery(
    {
      status: statusFilter === "ALL" ? undefined : statusFilter,
    },
    isPrivileged
  );

  const reviewMutation = useReviewOvertimeMutation();

  const handleReview = async (
    id: string,
    status: OvertimeStatus,
    promptReason: boolean = false
  ) => {
    let rejectionReason: string | undefined = undefined;
    if (promptReason && status === "REJECTED") {
      const reason = window.prompt("Enter rejection reason for this overtime request:");
      if (reason === null) return;
      rejectionReason = reason;
    }

    try {
      await reviewMutation.mutateAsync({
        id,
        payload: { status, rejectionReason },
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to review overtime request.");
    }
  };

  const pendingApprovals = (allData?.records || []).filter(
    (ot) => ot.status === "PENDING"
  );

  const renderStatusBadge = (status: OvertimeStatus) => {
    if (status === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Approved</span>
        </span>
      );
    }
    if (status === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <CancelIcon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>Rejected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <WarningIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Pending Review</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-teal-50 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-800 tracking-tight">
            Overtime Hours Management
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Log extra working hours for 1.5x premium wage compensation
          </p>
        </div>

        {currentUser?.role !== "ADMIN" && (
          <button
            type="button"
            onClick={() => setIsRequestModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <AddIcon className="w-4 h-4" />
            <span>Request Overtime</span>
          </button>
        )}
      </div>

      {/* 1. HR Pending Approvals Queue (HR / Admin only) */}
      {isPrivileged && pendingApprovals.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200/80 shadow-2xs p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-900 border-b border-amber-100 pb-3">
            <WarningIcon className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-black tracking-tight">
              Pending Overtime Approvals ({pendingApprovals.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingApprovals.map((ot) => {
              const emp =
                typeof ot.userId === "object"
                  ? (ot.userId as EmployeeSummary)
                  : null;

              return (
                <div
                  key={ot._id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {emp?.username || "Employee"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {emp?.department} • {emp?.designation}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                      {ot.hours} Hours ({ot.startTime} - {ot.endTime})
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 italic">
                    &quot;{ot.taskDescription}&quot;
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      Date: {new Date(ot.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReview(ot._id, "REJECTED", true)}
                        disabled={reviewMutation.isPending}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold transition cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReview(ot._id, "APPROVED", false)}
                        disabled={reviewMutation.isPending}
                        className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold transition cursor-pointer"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Main Overtime Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        {/* Filter Bar for HR */}
        {isPrivileged && (
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FilterListIcon className="w-4 h-4 text-teal-700" />
              Workforce Overtime Ledger
            </span>
            <div className="flex items-center gap-1.5">
              {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Table Content */}
        {isPrivileged ? (
          isAllLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading overtime records...</div>
          ) : (allData?.records || []).length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">No overtime requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Time Range</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-4">Task Description</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(allData?.records || []).map((ot) => {
                    const emp =
                      typeof ot.userId === "object"
                        ? (ot.userId as EmployeeSummary)
                        : null;

                    return (
                      <tr key={ot._id} className="hover:bg-teal-50/20">
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {emp?.username || "Employee"}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {new Date(ot.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {ot.startTime} – {ot.endTime}
                        </td>
                        <td className="py-3 px-3 font-bold text-teal-800 font-mono">
                          {ot.hours}h
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={ot.taskDescription}>
                          {ot.taskDescription}
                        </td>
                        <td className="py-3 px-3">{renderStatusBadge(ot.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Employee Self-Service View */
          isMyLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading your overtime log...</div>
          ) : (myData?.records || []).length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              You haven&apos;t submitted any overtime requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Time Range</th>
                    <th className="py-3 px-3">Hours</th>
                    <th className="py-3 px-4">Task Description</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(myData?.records || []).map((ot) => (
                    <tr key={ot._id} className="hover:bg-teal-50/20">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {new Date(ot.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {ot.startTime} – {ot.endTime}
                      </td>
                      <td className="py-3 px-3 font-bold text-teal-800 font-mono">
                        {ot.hours}h
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm truncate" title={ot.taskDescription}>
                        {ot.taskDescription}
                      </td>
                      <td className="py-3 px-3">{renderStatusBadge(ot.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Request Overtime Modal */}
      <OvertimeRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />
    </div>
  );
};
