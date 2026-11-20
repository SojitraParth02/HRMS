import { apiClient } from "./apiClient";
import {
  AttendanceRecord,
  TodayAttendanceData,
  AttendanceHistoryResponse,
  AttendanceCorrectionRecord,
  CreateCorrectionInput,
  ReviewCorrectionInput,
  CorrectionStatus,
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

export const getTodayAttendance = async (): Promise<TodayAttendanceData> => {
  const response = await apiClient.get<{
    status: string;
    data: TodayAttendanceData;
  }>("/api/attendance/today");
  return response.data.data;
};

export const getMyAttendanceHistory = async (
  page: number = 1,
  limit: number = 20,
  startDate?: string,
  endDate?: string
): Promise<AttendanceHistoryResponse> => {
  const response = await apiClient.get<{
    status: string;
    data: AttendanceHistoryResponse;
  }>("/api/attendance/my-history", {
    params: { page, limit, startDate, endDate },
  });
  return response.data.data;
};

export const getAllAttendanceRoster = async (
  date?: string,
  department?: string
): Promise<AttendanceRecord[]> => {
  const response = await apiClient.get<{
    status: string;
    data: { roster: AttendanceRecord[] };
  }>("/api/attendance/all", {
    params: { date, department },
  });
  return response.data.data.roster;
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

export const getCorrections = async (
  status?: CorrectionStatus
): Promise<AttendanceCorrectionRecord[]> => {
  const response = await apiClient.get<{
    status: string;
    data: { corrections: AttendanceCorrectionRecord[] };
  }>("/api/attendance/corrections", {
    params: { status },
  });
  return response.data.data.corrections;
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
