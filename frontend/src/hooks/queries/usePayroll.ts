import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  runPayrollDraftAPI,
  getPayrollRecordsAPI,
  adjustPayrollAPI,
  finalizePayrollAPI,
  getMyPayslipsAPI,
  getPayslipDetailsAPI,
} from "../../services/payroll.service";
import {
  PayrollData,
  PayrollStatus,
  AdjustPayrollInput,
  PayrollListResponse,
  UserPayslipsResponse,
  FinalizePayrollResponse,
} from "../../types/payroll.types";
import { ADVANCE_KEYS } from "./useAdvances";

export const PAYROLL_KEYS = {
  all: ["payroll"] as const,
  records: (monthYear?: string, status?: string) =>
    ["payroll", "records", { monthYear, status }] as const,
  myPayslips: (page: number, limit: number) =>
    ["payroll", "my-payslips", { page, limit }] as const,
  payslip: (id: string) => ["payroll", "payslip", id] as const,
};

export const usePayrollRecordsQuery = (
  monthYear?: string,
  status?: PayrollStatus,
  enabled: boolean = true
) => {
  return useQuery<PayrollData[], Error>({
    queryKey: PAYROLL_KEYS.records(monthYear, status),
    queryFn: () => getPayrollRecordsAPI(monthYear, status),
    enabled,
    staleTime: 60 * 1000,
  });
};

export const useMyPayslipsQuery = (page: number = 1, limit: number = 20) => {
  return useQuery<UserPayslipsResponse, Error>({
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
