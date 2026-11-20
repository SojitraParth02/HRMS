"use client";

import { useMutation, useQuery, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { useAppDispatch, useAppSelector } from "../redux";
import { setCredentials } from "../../store/slices/authSlice";
import { loginAdminAPI, getMeAPI } from "../../services/auth.service";
import {
  LoginPayload,
  LoginResponse,
  UserProfileResponse,
  ApiErrorResponse,
} from "../../types/auth.types";

export const useLoginMutation = (): UseMutationResult<
  LoginResponse,
  AxiosError<ApiErrorResponse>,
  LoginPayload
> => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return useMutation<LoginResponse, AxiosError<ApiErrorResponse>, LoginPayload>({
    mutationFn: loginAdminAPI,
    onSuccess: (response: LoginResponse): void => {
      const { user, token } = response.data;
      dispatch(setCredentials({ user, token }));
      router.replace("/dashboard");
    },
  });
};

export const useCurrentAdmin = (): UseQueryResult<
  UserProfileResponse,
  AxiosError<ApiErrorResponse>
> => {
  const tokenFromRedux: string | null = useAppSelector((state) => state.auth.token);
  const isEnabled: boolean =
    Boolean(tokenFromRedux) ||
    (typeof window !== "undefined" && Boolean(localStorage.getItem("token")));

  return useQuery<UserProfileResponse, AxiosError<ApiErrorResponse>>({
    queryKey: ["currentAdmin"],
    queryFn: getMeAPI,
    enabled: isEnabled,
  });
};
