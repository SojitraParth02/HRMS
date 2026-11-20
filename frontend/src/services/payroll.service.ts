import { apiClient } from "./apiClient";
import {
  PayrollData,
  PayrollStatus,
  AdjustPayrollInput,
  PayrollListResponse,
  UserPayslipsResponse,
  FinalizePayrollResponse,
} from "../types/payroll.types";

export const runPayrollDraftAPI = async (
  monthYear: string
): Promise<PayrollListResponse> => {
  const response = await apiClient.post<{
    status: string;
    message: string;
    data: PayrollListResponse;
  }>("/api/payroll/run", { monthYear });
  return response.data.data;
};

export const getPayrollRecordsAPI = async (
  monthYear?: string,
  status?: PayrollStatus
): Promise<PayrollData[]> => {
  const response = await apiClient.get<{
    status: string;
    data: { payrolls: PayrollData[] };
  }>("/api/payroll", {
    params: { monthYear, status },
  });
  return response.data.data.payrolls;
};

export const adjustPayrollAPI = async (
  id: string,
  payload: AdjustPayrollInput
): Promise<PayrollData> => {
  const response = await apiClient.patch<{
    status: string;
    message: string;
    data: { payroll: PayrollData };
  }>(`/api/payroll/${id}/adjust`, payload);
  return response.data.data.payroll;
};

export const finalizePayrollAPI = async (
  monthYear: string
): Promise<FinalizePayrollResponse> => {
  const response = await apiClient.post<{
    status: string;
    message: string;
    data: FinalizePayrollResponse;
  }>("/api/payroll/finalize", { monthYear });
  return response.data.data;
};

export const getMyPayslipsAPI = async (
  page: number = 1,
  limit: number = 20
): Promise<UserPayslipsResponse> => {
  const response = await apiClient.get<{
    status: string;
    data: UserPayslipsResponse;
  }>("/api/payroll/my-payslips", {
    params: { page, limit },
  });
  return response.data.data;
};

export const getPayslipDetailsAPI = async (
  id: string
): Promise<PayrollData> => {
  const response = await apiClient.get<{
    status: string;
    data: { payslip: PayrollData };
  }>(`/api/payroll/${id}/payslip`);
  return response.data.data.payslip;
};
