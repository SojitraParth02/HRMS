import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { store } from "../store";
import { logout } from "../store/slices/authSlice";

const rawBaseURL: string = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
// Normalize baseURL to prevent duplicate `/api` prefix (all service endpoints already start with `/api`)
const baseURL: string = rawBaseURL.replace(/\/api\/?$/, "");

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 45000, // 45 seconds to accommodate Render free-tier cold starts
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (typeof window !== "undefined") {
      const token: string | null = localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError): Promise<never> => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  (error: AxiosError<{ message?: string }>): Promise<never> => {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      error.message = "Server is waking up from sleep. Please wait a moment and try again.";
    }

    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        store.dispatch(logout());
        if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
