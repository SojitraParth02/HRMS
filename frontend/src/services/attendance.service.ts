import { apiClient } from "./apiClient";
import {
  AttendanceRecord,
  TodayAttendanceData,
  AttendanceHistoryResponse,
  AttendanceCorrectionRecord,
  CreateCorrectionInput,
  ReviewCorrectionInput,
  CorrectionStatus,
  BiometricImportResult,
  BiometricImportHistoryItem,
} from "../types/attendance.types";

export const punchIn = async (): Promise<AttendanceRecord> => {
  const response = await apiClient.post<{
    status: string;
    message: string;
    data: { attendance: AttendanceRecord };
  }>("/api/attendance/punch-in");
  return response.data.data.attendance;
};

export const punchOut = async (): Promise<AttendanceRecord> => {
  const response = await apiClient.post<{
    status: string;
    message: string;
    data: { attendance: AttendanceRecord };
  }>("/api/attendance/punch-out");
  return response.data.data.attendance;
};

import { IPaginatedResponse } from "../types/pagination.types";

export const getTodayAttendance = async (): Promise<TodayAttendanceData> => {
  const response = await apiClient.get<{
    status: string;
    data: TodayAttendanceData;
  }>("/api/attendance/today");
  return response.data.data;
};

export const getMyAttendanceHistory = async (
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string
): Promise<IPaginatedResponse<AttendanceRecord>> => {
  const response = await apiClient.get<IPaginatedResponse<AttendanceRecord>>(
    "/api/attendance/my-history",
    {
      params: { page, limit, startDate, endDate },
    }
  );
  return response.data;
};

export const getAllAttendanceRoster = async (
  date?: string,
  department?: string,
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<IPaginatedResponse<AttendanceRecord>> => {
  const response = await apiClient.get<IPaginatedResponse<AttendanceRecord>>(
    "/api/attendance/all",
    {
      params: { date, department, page, limit, search },
    }
  );
  return response.data;
};

export const submitCorrection = async (
  payload: CreateCorrectionInput
): Promise<AttendanceCorrectionRecord> => {
  const response = await apiClient.post<{
    status: string;
    message: string;
    data: { correction: AttendanceCorrectionRecord };
  }>("/api/attendance/correction", payload);
  return response.data.data.correction;
};

export const importBiometricCSV = async (
  file: File
): Promise<BiometricImportResult> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<{
    status: string;
    message: string;
    data: BiometricImportResult;
  }>("/api/attendance/import-csv", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data.data;
};

export const getBiometricImportHistory = async (): Promise<
  BiometricImportHistoryItem[]
> => {
  const response = await apiClient.get<{
    status: string;
    data: { history: BiometricImportHistoryItem[] };
  }>("/api/attendance/import-history");
  return response.data.data.history;
};

export const getCorrections = async (
  status?: CorrectionStatus,
  page: number = 1,
  limit: number = 10
): Promise<IPaginatedResponse<AttendanceCorrectionRecord>> => {
  const response = await apiClient.get<
    IPaginatedResponse<AttendanceCorrectionRecord>
  >("/api/attendance/corrections", {
    params: { status, page, limit },
  });
  return response.data;
};

export const reviewCorrection = async (
  id: string,
  payload: ReviewCorrectionInput
): Promise<AttendanceCorrectionRecord> => {
  const response = await apiClient.patch<{
    status: string;
    message: string;
    data: { correction: AttendanceCorrectionRecord };
  }>(`/api/attendance/corrections/${id}/review`, payload);
  return response.data.data.correction;
};
