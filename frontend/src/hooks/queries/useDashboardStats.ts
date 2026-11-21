import { useQuery } from "@tanstack/react-query";
import { getDashboardStatsAPI, DashboardQueryParams } from "../../services/dashboard.service";
import { DashboardStatsData } from "../../types/dashboard.types";

export const useDashboardStatsQuery = (params?: DashboardQueryParams) => {
  return useQuery<DashboardStatsData>({
    queryKey: ["dashboard-stats", params?.monthYear, params?.date],
    queryFn: () => getDashboardStatsAPI(params),
    staleTime: 60 * 1000,
  });
};
