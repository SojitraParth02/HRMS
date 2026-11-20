import { apiClient } from "./apiClient";
import {
  LeaveBalanceData,
  LeaveRecord,
  LeaveHistoryResponse,
  ApplyLeaveInput,
  ReviewLeaveInput,
  LeaveStatus,
} from "../types/leave.types";

export const getLeaveBalance = async (): Promise<LeaveBalanceData> => {
  const response = await apiClient.get<{
    status: string;
    data: LeaveBalanceData;
  }>("/api/leaves/balance");
  return response.data.data;
};

export const applyLeave = async (
  payload: ApplyLeaveInput
): Promise<{ leave: LeaveRecord; balance: LeaveBalanceData }> => {
  const response = await apiClient.post<{
    status: string;
    message: string;
    data: { leave: LeaveRecord; balance: LeaveBalanceData };
  }>("/api/leaves/apply", payload);
  return response.data.data;
};

export const getMyLeaves = async (
  page: number = 1,
  limit: number = 20
): Promise<LeaveHistoryResponse> => {
  const response = await apiClient.get<{
    status: string;
    data: LeaveHistoryResponse;
  }>("/api/leaves/my-leaves", {
    params: { page, limit },
  });
  return response.data.data;
};

export const getAllLeaves = async (
  status?: LeaveStatus,
  page: number = 1,
  limit: number = 20
): Promise<LeaveHistoryResponse> => {
  const response = await apiClient.get<{
    status: string;
    data: LeaveHistoryResponse;
  }>("/api/leaves/all", {
    params: { status, page, limit },
  });
  return response.data.data;
};

export const reviewLeave = async (
  id: string,
  payload: ReviewLeaveInput
): Promise<LeaveRecord> => {
  const response = await apiClient.patch<{
    status: string;
    message: string;
    data: { leave: LeaveRecord };
  }>(`/api/leaves/${id}/review`, payload);
  return response.data.data.leave;
};
