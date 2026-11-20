import { z } from "zod";

/**
 * Validation schema for date-range attendance reporting queries.
 */
export const attendanceReportQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
  department: z.string().optional(),
});

export type AttendanceReportQuery = z.infer<typeof attendanceReportQuerySchema>;

/**
 * Validation schema for monthly billing cycle reporting queries (Payroll & Overtime).
 */
export const monthlyReportQuerySchema = z.object({
  monthYear: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Month-Year must be in YYYY-MM format"),
  department: z.string().optional(),
});

export type MonthlyReportQuery = z.infer<typeof monthlyReportQuerySchema>;

// ============================================================================
// Attendance Report DTOs
// ============================================================================

export interface AttendanceReportRecord {
  userId: string;
  username: string;
  email: string;
  department: string;
  designation: string;
  totalRecordedDays: number;
  daysPresent: number;
  daysAbsent: number;
  halfDays: number;
  lateCount: number;
  totalWorkingMinutes: number;
  totalWorkingHours: number;
}

export interface AttendanceReportSummary {
  totalEmployees: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalHalfDays: number;
  totalLateCount: number;
  overallPresenceRate: number; // Percentage (e.g. 92.5)
}

export interface AttendanceReportDTO {
  summary: AttendanceReportSummary;
  records: AttendanceReportRecord[];
}

// ============================================================================
// Payroll & Salary Expenditure Report DTOs
// ============================================================================

export interface PayrollReportRecord {
  payrollId: string;
  userId: string;
  username: string;
  email: string;
  department: string;
  designation: string;
  baseSalary: number;
  lopDaysCount: number;
  lopDeduction: number;
  overtimeHours: number;
  overtimePay: number;
  advanceDeduction: number;
  bonus: number;
  otherDeductions: number;
  netSalary: number;
  status: string;
  isPaid: boolean;
  paidAt: string | null;
  paymentMethod: string | null;
  transactionReference: string | null;
}

export interface PayrollReportSummary {
  totalEmployees: number;
  totalGrossBudget: number;
  totalLopDeductions: number;
  totalAdvanceDeductions: number;
  totalBonusGiven: number;
  totalOvertimePaid: number;
  totalNetDisbursed: number;
  totalPaidCount: number;
  totalUnpaidCount: number;
}

export interface PayrollReportDTO {
  summary: PayrollReportSummary;
  records: PayrollReportRecord[];
}

// ============================================================================
// Overtime (OT) Utilization Report DTOs
// ============================================================================

export interface OvertimeReportRecord {
  userId: string;
  username: string;
  email: string;
  department: string;
  designation: string;
  approvedHours: number;
  monthlySalary: number;
  hourlyRate: number;
  otRate: number;
  totalOtPay: number;
  submissionsCount: number;
}

export interface OvertimeReportSummary {
  uniqueEmployeesCount: number;
  totalApprovedHours: number;
  totalOtPayout: number;
  averageHoursPerEmployee: number;
}

export interface OvertimeReportDTO {
  summary: OvertimeReportSummary;
  records: OvertimeReportRecord[];
}
