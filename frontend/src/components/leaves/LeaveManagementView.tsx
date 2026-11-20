"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAppSelector } from "../../hooks/redux";
import {
  useLeaveBalanceQuery,
  useMyLeavesQuery,
  useAllLeavesQuery,
  useReviewLeaveMutation,
} from "../../hooks/queries/useLeaves";
import { LeaveRecord, LeaveStatus, LeaveBalanceData } from "../../types/leave.types";
import { ApplyLeaveModal } from "./ApplyLeaveModal";
import {
  CalendarIcon,
  CheckCircleIcon,
  CancelIcon,
  WarningIcon,
  AccessTimeIcon,
  AddIcon,
  GroupIcon,
  PersonIcon,
  SettingsIcon,
} from "../icons";

export interface LeaveManagementViewProps {
  initialBalanceData?: LeaveBalanceData;
  isLoading?: boolean;
}

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({
  initialBalanceData,
  isLoading: propsIsLoading,
}) => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isPrivileged =
    currentUser?.role === "HR" || currentUser?.role === "ADMIN";

  const { data: queryBalanceData, isLoading: queryIsBalanceLoading } =
    useLeaveBalanceQuery();
  const balanceData = initialBalanceData ?? queryBalanceData;
  const isBalanceLoading = propsIsLoading ?? queryIsBalanceLoading;
  const { data: myLeavesData } = useMyLeavesQuery(1, 30);
  const { data: allLeavesData, isLoading: isAllLeavesLoading } =
    useAllLeavesQuery(
      undefined,
      1,
      50,
      isPrivileged
    );

  const reviewMutation = useReviewLeaveMutation();

  const [activeTab, setActiveTab] = useState<"my" | "review">("my");
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);

  const pendingCount =
    allLeavesData?.records.filter((r) => r.status === "PENDING").length ?? 0;

  const handleReview = async (
    leaveId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    let rejectionReason: string | undefined = undefined;
    if (status === "REJECTED") {
      const reasonInput = window.prompt(
        "Please enter the reason for rejection (optional):"
      );
      if (reasonInput === null) return;
      rejectionReason = reasonInput.trim() || undefined;
    }

    await reviewMutation.mutateAsync({
      id: leaveId,
      payload: { status, rejectionReason },
    });
  };

  const renderStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Approved</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <CancelIcon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Rejected</span>
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AccessTimeIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  const renderTypeBadge = (leave: LeaveRecord) => {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
          {leave.leaveType === "HALF_DAY" ? "Half Day (0.5)" : "Full Day"}
        </span>
        {leave.lossOfPayDaysCount > 0 && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {leave.lossOfPayDaysCount}d LOP
          </span>
        )}
        {leave.paidDaysCount > 0 && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            {leave.paidDaysCount}d Paid
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-8 py-6 flex-1 space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-block relative">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Leave Management
            </h1>
            <div className="w-10 h-[3px] bg-teal-600 rounded-full mt-1" />
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Paid annual allowances, half-day policies & Loss of Pay (LOP) tracking
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {isPrivileged && (
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-teal-200/80 bg-white hover:bg-teal-50/50 text-xs font-bold text-teal-800 transition-colors shadow-2xs"
            >
              <SettingsIcon className="w-4 h-4 text-teal-600" />
              <span className="hidden sm:inline">Configure Quota</span>
              <span className="sm:hidden">Settings</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl text-xs font-bold transition shadow-sm shadow-teal-700/20 cursor-pointer active:scale-98 select-none"
          >
            <AddIcon className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* 1. Leave Quota Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Annual Paid Quota */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Yearly Paid Quota
            </p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {isBalanceLoading ? "--" : `${balanceData?.yearlyPaidLeaveQuota ?? 5} Days`}
            </p>
          </div>
        </div>

        {/* Used Paid Leaves */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <AccessTimeIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Used Paid Leaves
            </p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {isBalanceLoading ? "--" : `${balanceData?.usedPaidDays ?? 0} Days`}
            </p>
          </div>
        </div>

        {/* Remaining Paid Leaves */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              (balanceData?.remainingPaidDays ?? 0) > 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            <CheckCircleIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Remaining Paid Balance
            </p>
            <p
              className={`text-xl font-black mt-0.5 ${
                (balanceData?.remainingPaidDays ?? 0) > 0
                  ? "text-emerald-700"
                  : "text-rose-600"
              }`}
            >
              {isBalanceLoading ? "--" : `${balanceData?.remainingPaidDays ?? 0} Days`}
            </p>
          </div>
        </div>

        {/* Loss of Pay (LOP) Days Taken */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <WarningIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Loss of Pay (LOP)
            </p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {isBalanceLoading ? "--" : `${balanceData?.totalLossOfPayDays ?? 0} Days`}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
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
          <span>My Leave History</span>
        </button>

        {isPrivileged && (
          <button
            type="button"
            onClick={() => setActiveTab("review")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer select-none ${
              activeTab === "review"
                ? "bg-teal-700 text-white shadow-sm shadow-teal-700/20"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <GroupIcon className="w-4 h-4" />
            <span>Workforce Review Queue</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tab Content 1: My Personal Leave History Table */}
      {activeTab === "my" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              Personal Applications Log
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total Applications: {myLeavesData?.total ?? 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Duration / Type</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Approval Status</th>
                  <th className="px-4 py-3">Reviewer / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!myLeavesData?.records || myLeavesData.records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No leave applications found.
                    </td>
                  </tr>
                ) : (
                  myLeavesData.records.map((leave) => {
                    const startStr = new Date(
                      leave.startDate
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                    const endStr = new Date(leave.endDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    );
                    const isSame =
                      leave.startDate.split("T")[0] ===
                      leave.endDate.split("T")[0];

                    const reviewer =
                      typeof leave.reviewedBy === "object"
                        ? leave.reviewedBy
                        : null;

                    return (
                      <tr
                        key={leave._id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {isSame ? endStr : `${startStr} – ${endStr}`}
                        </td>
                        <td className="px-4 py-3">{renderTypeBadge(leave)}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          {leave.reason}
                        </td>
                        <td className="px-4 py-3">
                          {renderStatusBadge(leave.status)}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {reviewer ? (
                            <div>
                              <p className="font-medium text-slate-700">
                                {reviewer.username}
                              </p>
                              {leave.rejectionReason && (
                                <p className="text-[10px] text-rose-600">
                                  {leave.rejectionReason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Awaiting Review</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Workforce Review Queue (HR / Admin View) */}
      {activeTab === "review" && isPrivileged && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              Workforce Applications Queue
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Total Records: {allLeavesData?.total ?? 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Type & Quota Split</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isAllLeavesLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Loading leave applications...
                    </td>
                  </tr>
                ) : !allLeavesData?.records ||
                  allLeavesData.records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No workforce leave records found.
                    </td>
                  </tr>
                ) : (
                  allLeavesData.records.map((leave) => {
                    const emp =
                      typeof leave.userId === "object" ? leave.userId : null;
                    const startStr = new Date(
                      leave.startDate
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                    const endStr = new Date(leave.endDate).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    );
                    const isSame =
                      leave.startDate.split("T")[0] ===
                      leave.endDate.split("T")[0];

                    return (
                      <tr
                        key={leave._id}
                        className="hover:bg-slate-50/80 transition"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <div>
                            <p>{emp?.username ?? "Unknown"}</p>
                            <p className="text-[10px] text-slate-400 font-normal">
                              {emp?.department ?? "--"} • {emp?.email ?? ""}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {isSame ? endStr : `${startStr} – ${endStr}`}
                        </td>
                        <td className="px-4 py-3">{renderTypeBadge(leave)}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          {leave.reason}
                        </td>
                        <td className="px-4 py-3">
                          {renderStatusBadge(leave.status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {leave.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleReview(leave._id, "APPROVED")
                                }
                                disabled={reviewMutation.isPending}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleReview(leave._id, "REJECTED")
                                }
                                disabled={reviewMutation.isPending}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              Reviewed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Application Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        balance={balanceData ?? null}
        onClose={() => setIsApplyModalOpen(false)}
      />
    </div>
  );
};
