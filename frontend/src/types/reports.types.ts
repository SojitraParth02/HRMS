// Filter parameter contracts
export interface AttendanceReportFilterParams {
  startDate: string;
  endDate: string;
  department?: string;
}

export interface MonthlyReportFilterParams {
  monthYear: string;
  department?: string;
}

// ============================================================================
// Attendance Report Types
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
  overallPresenceRate: number;
}

export interface AttendanceReportData {
  summary: AttendanceReportSummary;
  records: AttendanceReportRecord[];
}

// ============================================================================
// Payroll & Salary Expenditure Report Types
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

export interface PayrollReportData {
  summary: PayrollReportSummary;
  records: PayrollReportRecord[];
}

// ============================================================================
// Overtime (OT) Utilization Report Types
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

export interface OvertimeReportData {
  summary: OvertimeReportSummary;
  records: OvertimeReportRecord[];
}
