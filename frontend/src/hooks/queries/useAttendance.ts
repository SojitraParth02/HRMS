import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  punchIn,
  punchOut,
  getTodayAttendance,
  getMyAttendanceHistory,
  getAllAttendanceRoster,
  submitCorrection,
  getCorrections,
  reviewCorrection,
  importBiometricCSV,
  getBiometricImportHistory,
} from "../../services/attendance.service";
import {
  TodayAttendanceData,
  AttendanceHistoryResponse,
  AttendanceRecord,
  AttendanceCorrectionRecord,
  CreateCorrectionInput,
  ReviewCorrectionInput,
  CorrectionStatus,
  BiometricImportResult,
  BiometricImportHistoryItem,
} from "../../types/attendance.types";

export const ATTENDANCE_KEYS = {
  today: ["attendance", "today"] as const,
  history: (page: number, limit: number, startDate?: string, endDate?: string) =>
    ["attendance", "history", { page, limit, startDate, endDate }] as const,
  roster: (date?: string, department?: string) =>
    ["attendance", "roster", { date, department }] as const,
  corrections: (status?: CorrectionStatus) =>
    ["attendance", "corrections", { status }] as const,
};

export const useTodayAttendanceQuery = () => {
  return useQuery<TodayAttendanceData, Error>({
    queryKey: ATTENDANCE_KEYS.today,
    queryFn: getTodayAttendance,
    refetchInterval: 60 * 1000, // Sync status every minute
    staleTime: 30 * 1000,
  });
};

export const useMyAttendanceHistoryQuery = (
  page: number = 1,
  limit: number = 20,
  startDate?: string,
  endDate?: string
) => {
  return useQuery<AttendanceHistoryResponse, Error>({
    queryKey: ATTENDANCE_KEYS.history(page, limit, startDate, endDate),
    queryFn: () => getMyAttendanceHistory(page, limit, startDate, endDate),
    staleTime: 60 * 1000,
  });
};

export const useAllAttendanceRosterQuery = (
  date?: string,
  department?: string,
  enabled: boolean = true
) => {
  return useQuery<AttendanceRecord[], Error>({
    queryKey: ATTENDANCE_KEYS.roster(date, department),
    queryFn: () => getAllAttendanceRoster(date, department),
    enabled,
    staleTime: 60 * 1000,
  });
};

export const usePunchInMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: punchIn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};

export const usePunchOutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: punchOut,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};

export const useSubmitCorrectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCorrectionInput) => submitCorrection(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};

export const useCorrectionsQuery = (
  status?: CorrectionStatus,
  enabled: boolean = true
) => {
  return useQuery<AttendanceCorrectionRecord[], Error>({
    queryKey: ATTENDANCE_KEYS.corrections(status),
    queryFn: () => getCorrections(status),
    enabled,
    staleTime: 30 * 1000,
  });
};

export const useReviewCorrectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ReviewCorrectionInput;
    }) => reviewCorrection(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};

export const useImportBiometricMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importBiometricCSV(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
};

export const useBiometricImportHistoryQuery = (enabled: boolean = true) => {
  return useQuery<BiometricImportHistoryItem[], Error>({
    queryKey: ["attendance", "import-history"],
    queryFn: getBiometricImportHistory,
    enabled,
    staleTime: 60 * 1000,
  });
};
