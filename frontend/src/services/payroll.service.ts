import { apiClient } from "./apiClient";
import {
  PayrollData,
  PayrollStatus,
  AdjustPayrollInput,
  PayrollListResponse,
  UserPayslipsResponse,
  FinalizePayrollResponse,
  MarkPaidInput,
  MarkMonthPaidInput,
  MarkMonthPaidResponse,
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

import { IPaginatedResponse } from "../types/pagination.types";

export const getPayrollRecordsAPI = async (
  monthYear?: string,
  status?: PayrollStatus,
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<IPaginatedResponse<PayrollData>> => {
  const response = await apiClient.get<IPaginatedResponse<PayrollData>>(
    "/api/payroll",
    {
      params: { monthYear, status, page, limit, search },
    }
  );
  return response.data;
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
  limit: number = 10
): Promise<IPaginatedResponse<PayrollData>> => {
  const response = await apiClient.get<IPaginatedResponse<PayrollData>>(
    "/api/payroll/my-payslips",
    {
      params: { page, limit },
    }
  );
  return response.data;
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

export const markPayrollPaidAPI = async (
  id: string,
  payload: MarkPaidInput
): Promise<PayrollData> => {
  const response = await apiClient.patch<{
    status: string;
    message: string;
    data: { payroll: PayrollData };
  }>(`/api/payroll/${id}/pay`, payload);
  return response.data.data.payroll;
};

export const markMonthPayrollPaidAPI = async (
  payload: MarkMonthPaidInput
): Promise<MarkMonthPaidResponse> => {
  const response = await apiClient.post<{
    status: string;
    message: string;
    data: MarkMonthPaidResponse;
  }>("/api/payroll/pay-month", payload);
  return response.data.data;
};
