export interface DashboardKpis {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  halfDayToday: number;
  presenceRate: number;
  headcountTrend: number;
  presentTrend: number;
  absentTrend: number;
  lateTrend: number;
}

export interface AttendanceBreakdown {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  totalLogged: number;
  presencePercentage: number;
  absentPercentage: number;
  latePercentage: number;
}

export interface MonthlyPayrollPoint {
  month: string;
  monthYear: string;
  amount: number;
}

export interface PayrollSummary {
  totalDisbursed: number;
  totalGross: number;
  totalLopDeductions: number;
  totalAdvanceDeductions: number;
  totalOvertimePay: number;
  processedCount: number;
  pendingCount: number;
  processedPercentage: number;
  payrollTrendPct: number;
  monthlyTrend: MonthlyPayrollPoint[];
}

export interface OvertimeDepartmentBucket {
  label: string;
  hours: number;
  percentage: number;
}

export interface OvertimeMetrics {
  totalApprovedHours: number;
  monthlyCost: number;
  otTrendPct: number;
  departmentDistribution: OvertimeDepartmentBucket[];
}

export interface ActionQueue {
  pendingLeaves: number;
  pendingCorrections: number;
  pendingOvertime: number;
  totalPending: number;
}

export interface DashboardStatsData {
  filters: {
    monthYear: string;
    date: string;
  };
  kpis: DashboardKpis;
  attendance: AttendanceBreakdown;
  payroll: PayrollSummary;
  overtime: OvertimeMetrics;
  actionQueue: ActionQueue;
}

export interface DashboardStatsResponse {
  status: "success" | "fail" | "error";
  data: DashboardStatsData;
  message?: string;
}
