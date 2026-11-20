import { UserRole } from "./employee.types";

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface SetCredentialsPayload {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  user: User;
}

export interface LoginResponse {
  status: string;
  message?: string;
  data: LoginResponseData;
}

export interface UserProfileResponseData {
  user: User;
}

export interface UserProfileResponse {
  status: string;
  message?: string;
  data: UserProfileResponseData;
}

export interface ApiErrorResponse {
  status?: string;
  message?: string;
}
