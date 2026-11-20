import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  logAdvanceAPI,
  getAdvancesAPI,
  getMyAdvancesAPI,
} from "../../services/advance.service";
import {
  SalaryAdvanceData,
  CreateAdvanceInput,
  AdvanceListResponse,
} from "../../types/payroll.types";

export const ADVANCE_KEYS = {
  all: ["advances"] as const,
  my: (page: number, limit: number) =>
    ["advances", "my", { page, limit }] as const,
  list: (filters?: Record<string, unknown>) =>
    ["advances", "list", filters] as const,
};

export const useAdvancesQuery = (
  filters?: {
    monthYear?: string;
    isDeducted?: boolean;
    userId?: string;
    page?: number;
    limit?: number;
  },
  enabled: boolean = true
) => {
  return useQuery<AdvanceListResponse, Error>({
    queryKey: ADVANCE_KEYS.list(filters),
    queryFn: () => getAdvancesAPI(filters),
    enabled,
    staleTime: 60 * 1000,
  });
};

export const useMyAdvancesQuery = (page: number = 1, limit: number = 20) => {
  return useQuery<AdvanceListResponse, Error>({
    queryKey: ADVANCE_KEYS.my(page, limit),
    queryFn: () => getMyAdvancesAPI(page, limit),
    staleTime: 60 * 1000,
  });
};

export const useLogAdvanceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<SalaryAdvanceData, Error, CreateAdvanceInput>({
    mutationFn: (payload) => logAdvanceAPI(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADVANCE_KEYS.all });
    },
  });
};
