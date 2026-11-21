import { apiClient } from "./apiClient";
import {
  OvertimeRequestData,
  CreateOvertimeInput,
  ReviewOvertimeInput,
  OvertimeStatus,
} from "../types/payroll.types";
import { IPaginatedResponse } from "../types/pagination.types";

export const submitOvertimeAPI = async (
  payload: CreateOvertimeInput
): Promise<OvertimeRequestData> => {
  const response = await apiClient.post<{
    status: string;
    message: string;
    data: { overtime: OvertimeRequestData };
  }>("/api/overtime", payload);
  return response.data.data.overtime;
};

export const getMyOvertimeAPI = async (
  page: number = 1,
  limit: number = 10
): Promise<IPaginatedResponse<OvertimeRequestData>> => {
  const response = await apiClient.get<IPaginatedResponse<OvertimeRequestData>>(
    "/api/overtime/my",
    {
      params: { page, limit },
    }
  );
  return response.data;
};

export const getAllOvertimeAPI = async (filters?: {
  status?: OvertimeStatus;
  startDate?: string;
  endDate?: string;
  userId?: string;
  page?: number;
  limit?: number;
  search?: string;
}): Promise<IPaginatedResponse<OvertimeRequestData>> => {
  const response = await apiClient.get<IPaginatedResponse<OvertimeRequestData>>(
    "/api/overtime/all",
    {
      params: filters,
    }
  );
  return response.data;
};

export const reviewOvertimeAPI = async (
  id: string,
  payload: ReviewOvertimeInput
): Promise<OvertimeRequestData> => {
  const response = await apiClient.patch<{
    status: string;
    message: string;
    data: { overtime: OvertimeRequestData };
  }>(`/api/overtime/${id}/review`, payload);
  return response.data.data.overtime;
};
