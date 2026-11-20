import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLeaveBalance,
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
} from "../../services/leave.service";
import {
  LeaveBalanceData,
  LeaveHistoryResponse,
  LeaveRecord,
  ApplyLeaveInput,
  ReviewLeaveInput,
  LeaveStatus,
} from "../../types/leave.types";

export const LEAVE_KEYS = {
  balance: ["leaves", "balance"] as const,
  myLeaves: (page: number, limit: number) =>
    ["leaves", "my-leaves", { page, limit }] as const,
  allLeaves: (status?: LeaveStatus, page?: number, limit?: number) =>
    ["leaves", "all", { status, page, limit }] as const,
};

export const useLeaveBalanceQuery = () => {
  return useQuery<LeaveBalanceData, Error>({
    queryKey: LEAVE_KEYS.balance,
    queryFn: getLeaveBalance,
    staleTime: 60 * 1000,
  });
};

export const useMyLeavesQuery = (page: number = 1, limit: number = 20) => {
  return useQuery<LeaveHistoryResponse, Error>({
    queryKey: LEAVE_KEYS.myLeaves(page, limit),
    queryFn: () => getMyLeaves(page, limit),
    staleTime: 60 * 1000,
  });
};

export const useAllLeavesQuery = (
  status?: LeaveStatus,
  page: number = 1,
  limit: number = 20,
  enabled: boolean = true
) => {
  return useQuery<LeaveHistoryResponse, Error>({
    queryKey: LEAVE_KEYS.allLeaves(status, page, limit),
    queryFn: () => getAllLeaves(status, page, limit),
    enabled,
    staleTime: 60 * 1000,
  });
};

export const useApplyLeaveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplyLeaveInput) => applyLeave(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
  });
};

export const useReviewLeaveMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ReviewLeaveInput;
    }) => reviewLeave(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
  });
};
