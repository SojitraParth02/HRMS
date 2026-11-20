import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCompanySettings,
  updateCompanySettings,
} from "../../services/settings.service";
import {
  CompanySettings,
  UpdateCompanySettingsPayload,
} from "../../types/settings.types";
import { ATTENDANCE_KEYS } from "./useAttendance";
import { LEAVE_KEYS } from "./useLeaves";

export const SETTINGS_KEYS = {
  settings: ["company-settings"] as const,
};

export const useCompanySettingsQuery = () => {
  return useQuery<CompanySettings, Error>({
    queryKey: SETTINGS_KEYS.settings,
    queryFn: getCompanySettings,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateCompanySettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CompanySettings, Error, UpdateCompanySettingsPayload>({
    mutationFn: (payload) => updateCompanySettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.settings });
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEYS.today });
      queryClient.invalidateQueries({ queryKey: LEAVE_KEYS.balance });
    },
  });
};
