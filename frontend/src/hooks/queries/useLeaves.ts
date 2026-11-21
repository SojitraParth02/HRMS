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
  LeaveRecord,
  ApplyLeaveInput,
  ReviewLeaveInput,
  LeaveStatus,
} from "../../types/leave.types";
import { IPaginatedResponse } from "../../types/pagination.types";

export const LEAVE_KEYS = {
  balance: ["leaves", "balance"] as const,
  myLeaves: (page: number, limit: number) =>
    ["leaves", "my-leaves", { page, limit }] as const,
  allLeaves: (status?: LeaveStatus, page?: number, limit?: number, search?: string) =>
    ["leaves", "all", { status, page, limit, search }] as const,
};

export const useLeaveBalanceQuery = () => {
  return useQuery<LeaveBalanceData, Error>({
    queryKey: LEAVE_KEYS.balance,
    queryFn: getLeaveBalance,
    staleTime: 60 * 1000,
  });
};

export const useMyLeavesQuery = (page: number = 1, limit: number = 10) => {
  return useQuery<IPaginatedResponse<LeaveRecord>, Error>({
    queryKey: LEAVE_KEYS.myLeaves(page, limit),
    queryFn: () => getMyLeaves(page, limit),
    staleTime: 60 * 1000,
  });
};

export const useAllLeavesQuery = (
  status?: LeaveStatus,
  page: number = 1,
  limit: number = 10,
  enabled: boolean = true,
  search?: string
) => {
  return useQuery<IPaginatedResponse<LeaveRecord>, Error>({
    queryKey: LEAVE_KEYS.allLeaves(status, page, limit, search),
    queryFn: () => getAllLeaves(status, page, limit, search),
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
