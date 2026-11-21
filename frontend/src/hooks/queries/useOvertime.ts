import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  submitOvertimeAPI,
  getMyOvertimeAPI,
  getAllOvertimeAPI,
  reviewOvertimeAPI,
} from "../../services/overtime.service";
import {
  OvertimeRequestData,
  CreateOvertimeInput,
  ReviewOvertimeInput,
  OvertimeStatus,
} from "../../types/payroll.types";
import { IPaginatedResponse } from "../../types/pagination.types";

export const OVERTIME_KEYS = {
  all: ["overtime"] as const,
  my: (page: number, limit: number) =>
    ["overtime", "my", { page, limit }] as const,
  list: (filters?: Record<string, unknown>) =>
    ["overtime", "list", filters] as const,
};

export const useMyOvertimeQuery = (page: number = 1, limit: number = 10) => {
  return useQuery<IPaginatedResponse<OvertimeRequestData>, Error>({
    queryKey: OVERTIME_KEYS.my(page, limit),
    queryFn: () => getMyOvertimeAPI(page, limit),
    staleTime: 60 * 1000,
  });
};

export const useAllOvertimeQuery = (
  filters?: {
    status?: OvertimeStatus;
    startDate?: string;
    endDate?: string;
    userId?: string;
    page?: number;
    limit?: number;
    search?: string;
  },
  enabled: boolean = true
) => {
  return useQuery<IPaginatedResponse<OvertimeRequestData>, Error>({
    queryKey: OVERTIME_KEYS.list(filters),
    queryFn: () => getAllOvertimeAPI(filters),
    enabled,
    staleTime: 60 * 1000,
  });
};

export const useSubmitOvertimeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<OvertimeRequestData, Error, CreateOvertimeInput>({
    mutationFn: (payload) => submitOvertimeAPI(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OVERTIME_KEYS.all });
    },
  });
};

export const useReviewOvertimeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    OvertimeRequestData,
    Error,
    { id: string; payload: ReviewOvertimeInput }
  >({
    mutationFn: ({ id, payload }) => reviewOvertimeAPI(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OVERTIME_KEYS.all });
    },
  });
};
