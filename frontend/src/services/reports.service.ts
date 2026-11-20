import { apiClient } from "./apiClient";
import {
  AttendanceReportFilterParams,
  AttendanceReportData,
  MonthlyReportFilterParams,
  PayrollReportData,
  OvertimeReportData,
} from "../types/reports.types";

/**
 * Fetches attendance date-range audit report with summarized presence rate and workforce logs.
 */
export const getAttendanceReportAPI = async (
  params: AttendanceReportFilterParams
): Promise<AttendanceReportData> => {
  const response = await apiClient.get<{
    status: string;
    data: AttendanceReportData;
  }>("/api/reports/attendance", {
    params: {
      startDate: params.startDate,
      endDate: params.endDate,
      department: params.department || undefined,
    },
  });
  return response.data.data;
};

/**
 * Fetches monthly payroll and salary expenditure report with corporate budget totals and disbursement status.
 */
export const getPayrollReportAPI = async (
  params: MonthlyReportFilterParams
): Promise<PayrollReportData> => {
  const response = await apiClient.get<{
    status: string;
    data: PayrollReportData;
  }>("/api/reports/payroll", {
    params: {
      monthYear: params.monthYear,
      department: params.department || undefined,
    },
  });
  return response.data.data;
};

/**
 * Fetches monthly overtime utilization report with approved hours and statutory 1.5x wage payout totals.
 */
export const getOvertimeReportAPI = async (
  params: MonthlyReportFilterParams
): Promise<OvertimeReportData> => {
  const response = await apiClient.get<{
    status: string;
    data: OvertimeReportData;
  }>("/api/reports/overtime", {
    params: {
      monthYear: params.monthYear,
      department: params.department || undefined,
    },
  });
  return response.data.data;
};
