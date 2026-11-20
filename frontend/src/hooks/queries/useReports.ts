import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getAttendanceReportAPI,
  getPayrollReportAPI,
  getOvertimeReportAPI,
} from "../../services/reports.service";
import {
  AttendanceReportFilterParams,
  AttendanceReportData,
  MonthlyReportFilterParams,
  PayrollReportData,
  OvertimeReportData,
} from "../../types/reports.types";

export const REPORTS_KEYS = {
  all: ["reports"] as const,
  attendance: (params: AttendanceReportFilterParams) =>
    ["reports", "attendance", params] as const,
  payroll: (params: MonthlyReportFilterParams) =>
    ["reports", "payroll", params] as const,
  overtime: (params: MonthlyReportFilterParams) =>
    ["reports", "overtime", params] as const,
};

/**
 * Hook to fetch attendance report for a specified date range and department.
 * Uses 60s staleTime and keepPreviousData for smooth filtering.
 */
export const useAttendanceReportQuery = (
  params: AttendanceReportFilterParams,
  enabled: boolean = true
) => {
  return useQuery<AttendanceReportData, Error>({
    queryKey: REPORTS_KEYS.attendance(params),
    queryFn: () => getAttendanceReportAPI(params),
    enabled: enabled && Boolean(params.startDate) && Boolean(params.endDate),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to fetch monthly payroll report for a specified billing cycle and department.
 * Uses 60s staleTime and keepPreviousData.
 */
export const usePayrollReportQuery = (
  params: MonthlyReportFilterParams,
  enabled: boolean = true
) => {
  return useQuery<PayrollReportData, Error>({
    queryKey: REPORTS_KEYS.payroll(params),
    queryFn: () => getPayrollReportAPI(params),
    enabled: enabled && Boolean(params.monthYear),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

/**
 * Hook to fetch monthly overtime report with 1.5x wage payouts.
 * Uses 60s staleTime and keepPreviousData.
 */
export const useOvertimeReportQuery = (
  params: MonthlyReportFilterParams,
  enabled: boolean = true
) => {
  return useQuery<OvertimeReportData, Error>({
    queryKey: REPORTS_KEYS.overtime(params),
    queryFn: () => getOvertimeReportAPI(params),
    enabled: enabled && Boolean(params.monthYear),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
