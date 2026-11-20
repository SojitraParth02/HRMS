import { AttendanceUserSummary } from "./attendance.types";

export type LeaveType = "FULL_DAY" | "HALF_DAY";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface LeaveBalanceData {
  yearlyPaidLeaveQuota: number;
  usedPaidDays: number;
  remainingPaidDays: number;
  totalLossOfPayDays: number;
}

export interface LeaveRecord {
  _id: string;
  userId: string | AttendanceUserSummary;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  numberOfDays: number;
  reason: string;
  status: LeaveStatus;
  isPaid: boolean;
  paidDaysCount: number;
  lossOfPayDaysCount: number;
  reviewedBy?: string | { _id: string; username: string; email: string } | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ApplyLeaveInput {
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
}

export interface ReviewLeaveInput {
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
}

export interface LeaveHistoryResponse {
  records: LeaveRecord[];
  total: number;
  page: number;
  limit: number;
}
