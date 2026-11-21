import { apiClient } from "./apiClient";
import {
  SalaryAdvanceData,
  CreateAdvanceInput,
} from "../types/payroll.types";
import { IPaginatedResponse } from "../types/pagination.types";

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
  search?: string;
}): Promise<IPaginatedResponse<SalaryAdvanceData>> => {
  const response = await apiClient.get<IPaginatedResponse<SalaryAdvanceData>>(
    "/api/advances",
    {
      params: filters,
    }
  );
  return response.data;
};

export const getMyAdvancesAPI = async (
  page: number = 1,
  limit: number = 10
): Promise<IPaginatedResponse<SalaryAdvanceData>> => {
  const response = await apiClient.get<IPaginatedResponse<SalaryAdvanceData>>(
    "/api/advances/my",
    {
      params: { page, limit },
    }
  );
  return response.data;
};
