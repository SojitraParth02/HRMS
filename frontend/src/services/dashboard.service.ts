import { apiClient } from "./apiClient";
import { DashboardStatsData, DashboardStatsResponse } from "../types/dashboard.types";

export interface DashboardQueryParams {
  monthYear?: string;
  date?: string;
}

export const getDashboardStatsAPI = async (
  params?: DashboardQueryParams
): Promise<DashboardStatsData> => {
  const response = await apiClient.get<DashboardStatsResponse>("/api/dashboard/stats", {
    params,
  });
  return response.data.data;
};
