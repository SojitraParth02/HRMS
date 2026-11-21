import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  runPayrollDraftAPI,
  getPayrollRecordsAPI,
  adjustPayrollAPI,
  finalizePayrollAPI,
  getMyPayslipsAPI,
  getPayslipDetailsAPI,
  markPayrollPaidAPI,
  markMonthPayrollPaidAPI,
} from "../../services/payroll.service";
import {
  PayrollData,
  PayrollStatus,
  AdjustPayrollInput,
  PayrollListResponse,
  FinalizePayrollResponse,
  MarkPaidInput,
  MarkMonthPaidInput,
  MarkMonthPaidResponse,
} from "../../types/payroll.types";
import { IPaginatedResponse } from "../../types/pagination.types";
import { ADVANCE_KEYS } from "./useAdvances";

export const PAYROLL_KEYS = {
  all: ["payroll"] as const,
  records: (monthYear?: string, status?: string, page?: number, limit?: number, search?: string) =>
    ["payroll", "records", { monthYear, status, page, limit, search }] as const,
  myPayslips: (page: number, limit: number) =>
    ["payroll", "my-payslips", { page, limit }] as const,
  payslip: (id: string) => ["payroll", "payslip", id] as const,
};

export const usePayrollRecordsQuery = (
  monthYear?: string,
  search?: string,
  page: number = 1,
  limit: number = 10,
  status?: PayrollStatus,
  enabled: boolean = true
) => {
  return useQuery<IPaginatedResponse<PayrollData>, Error>({
    queryKey: PAYROLL_KEYS.records(monthYear, status, page, limit, search),
    queryFn: () => getPayrollRecordsAPI(monthYear, status, page, limit, search),
    enabled,
    staleTime: 60 * 1000,
  });
};

export const useMyPayslipsQuery = (page: number = 1, limit: number = 10) => {
  return useQuery<IPaginatedResponse<PayrollData>, Error>({
    queryKey: PAYROLL_KEYS.myPayslips(page, limit),
    queryFn: () => getMyPayslipsAPI(page, limit),
    staleTime: 60 * 1000,
  });
};

export const usePayslipDetailsQuery = (
  id: string,
  enabled: boolean = true
) => {
  return useQuery<PayrollData, Error>({
    queryKey: PAYROLL_KEYS.payslip(id),
    queryFn: () => getPayslipDetailsAPI(id),
    enabled: enabled && Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRunPayrollMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<PayrollListResponse, Error, string>({
    mutationFn: (monthYear) => runPayrollDraftAPI(monthYear),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.all });
    },
  });
};

export const useAdjustPayrollMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    PayrollData,
    Error,
    { id: string; payload: AdjustPayrollInput }
  >({
    mutationFn: ({ id, payload }) => adjustPayrollAPI(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.all });
    },
  });
};

export const useFinalizePayrollMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<FinalizePayrollResponse, Error, string>({
    mutationFn: (monthYear) => finalizePayrollAPI(monthYear),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ADVANCE_KEYS.all });
    },
  });
};

export const useMarkPayrollPaidMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    PayrollData,
    Error,
    { id: string; payload: MarkPaidInput }
  >({
    mutationFn: ({ id, payload }) => markPayrollPaidAPI(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.all });
    },
  });
};

export const useMarkMonthPayrollPaidMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<MarkMonthPaidResponse, Error, MarkMonthPaidInput>({
    mutationFn: (payload) => markMonthPayrollPaidAPI(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYROLL_KEYS.all });
    },
  });
};
