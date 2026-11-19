import apiClient from "./apiClient";
import {
  LoginPayload,
  LoginResponse,
  UserProfileResponse,
} from "../types/auth.types";

export const loginAdminAPI = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>("/api/auth/login", payload);
  return response.data;
};

export const getMeAPI = async (): Promise<UserProfileResponse> => {
  const response = await apiClient.get<UserProfileResponse>("/api/auth/me");
  return response.data;
};
