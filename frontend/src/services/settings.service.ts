import { apiClient } from "./apiClient";
import {
  CompanySettings,
  UpdateCompanySettingsPayload,
} from "../types/settings.types";

export const getCompanySettings = async (): Promise<CompanySettings> => {
  const response = await apiClient.get<{
    status: string;
    data: { settings: CompanySettings };
  }>("/api/settings");
  return response.data.data.settings;
};

export const updateCompanySettings = async (
  payload: UpdateCompanySettingsPayload
): Promise<CompanySettings> => {
  const response = await apiClient.put<{
    status: string;
    message: string;
    data: { settings: CompanySettings };
  }>("/api/settings", payload);
  return response.data.data.settings;
};
