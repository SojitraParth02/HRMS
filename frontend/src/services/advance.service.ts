import { apiClient } from "./apiClient";
import {
  SalaryAdvanceData,
  CreateAdvanceInput,
  AdvanceListResponse,
} from "../types/payroll.types";

export const logAdvanceAPI = async (
  payload: CreateAdvanceInput
): Promise<SalaryAdvanceData> => {
  const response = await apiClient.post<{
    status: string;
    message: string;
    data: { advance: SalaryAdvanceData };
  }>("/api/advances", payload);
  return response.data.data.advance;
};

export const getAdvancesAPI = async (filters?: {
  monthYear?: string;
  isDeducted?: boolean;
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<AdvanceListResponse> => {
  const response = await apiClient.get<{
    status: string;
    data: AdvanceListResponse;
  }>("/api/advances", {
    params: filters,
  });
  return response.data.data;
};

export const getMyAdvancesAPI = async (
  page: number = 1,
  limit: number = 20
): Promise<AdvanceListResponse> => {
  const response = await apiClient.get<{
    status: string;
    data: AdvanceListResponse;
  }>("/api/advances/my", {
    params: { page, limit },
  });
  return response.data.data;
};
