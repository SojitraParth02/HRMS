export interface EmployeeSummary {
  _id: string;
  username: string;
  email: string;
  department?: string;
  designation?: string;
  phone?: string;
  monthlySalary?: number;
}

// ==========================================
// 1. Overtime Types
// ==========================================
export type OvertimeStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface OvertimeRequestData {
  _id: string;
  userId: string | EmployeeSummary;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  taskDescription: string;
  status: OvertimeStatus;
  reviewedBy?: string | EmployeeSummary | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  payrollCycle?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOvertimeInput {
  date: string;
  startTime: string;
  endTime: string;
  taskDescription: string;
}

export interface ReviewOvertimeInput {
  status: OvertimeStatus;
  rejectionReason?: string;
}

export interface OvertimeListResponse {
  records: OvertimeRequestData[];
  total: number;
  page: number;
  limit: number;
}

// ==========================================
// 2. Salary Advance Types
// ==========================================
export interface SalaryAdvanceData {
  _id: string;
  userId: string | EmployeeSummary;
  date: string;
  amount: number;
  reason: string;
  givenBy: string | EmployeeSummary;
  monthYear: string;
  isDeducted: boolean;
  payrollId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdvanceInput {
  userId: string;
  amount: number;
  reason: string;
  monthYear: string;
  date?: string;
}

export interface AdvanceListResponse {
  records: SalaryAdvanceData[];
  total: number;
  page: number;
  limit: number;
}

// ==========================================
// 3. Payroll & Payslip Types
// ==========================================
export type PayrollStatus = "DRAFT" | "FINALIZED";

export interface PayrollData {
  _id: string;
  userId: string | EmployeeSummary;
  monthYear: string;
  status: PayrollStatus;

  // Frozen Financial Snapshot
  baseSalary: number;
  perDayRate: number;
  hourlyRate: number;
  workingDaysStandard: number;
  lopDaysCount: number;
  lopDeduction: number;
  overtimeHours: number;
  overtimeHourlyRate: number;
  overtimePay: number;
  advanceDeduction: number;
  bonus: number;
  otherDeductions: number;
  netSalary: number;

  // Audit Details
  generatedBy: string | EmployeeSummary;
  finalizedBy?: string | EmployeeSummary | null;
  finalizedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdjustPayrollInput {
  bonus?: number;
  otherDeductions?: number;
  notes?: string;
}

export interface PayrollListResponse {
  payrolls: PayrollData[];
  monthYear?: string;
}

export interface UserPayslipsResponse {
  records: PayrollData[];
  total: number;
  page: number;
  limit: number;
}

export interface FinalizePayrollResponse {
  finalizedCount: number;
  monthYear: string;
}
