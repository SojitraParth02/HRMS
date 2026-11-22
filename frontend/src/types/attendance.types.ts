export type AttendanceStatus = "PRESENT" | "HALF_DAY" | "ABSENT" | "ON_LEAVE" | "WEEKLY_OFF";
export type CorrectionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CompanySettings {
  shiftStartTime: string;
  shiftEndTime: string;
  graceWindowEndTime: string;
  standardWorkHoursPerDay: number;
  lunchStartTime?: string;
  lunchEndTime?: string;
  yearlyPaidLeaveQuota: number;
}

export interface AttendanceUserSummary {
  _id: string;
  username: string;
  email: string;
  department?: string;
  designation?: string;
  role?: string;
}

export interface AttendanceRecord {
  _id: string;
  userId: string | AttendanceUserSummary;
  date: string;
  punchIn: string | null;
  punchOut: string | null;
  status: AttendanceStatus;
  isLate: boolean;
  lateMinutes: number;
  flexMinutesOwed: number;
  expectedPunchOut: string | null;
  isCompensated: boolean;
  earlyLeavingMinutes?: number;
  totalWorkingMinutes: number;
  isCorrected: boolean;
  correctionRequestId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TodayAttendanceData {
  attendance: AttendanceRecord | null;
  settings: CompanySettings;
  isWeekend?: boolean;
  dayType?: "WORK_DAY" | "WEEKLY_OFF";
}

export interface AttendanceCorrectionRecord {
  _id: string;
  attendanceId: string | AttendanceRecord;
  userId: string | AttendanceUserSummary;
  date: string;
  originalPunchIn: string;
  requestedPunchIn: string;
  originalPunchOut?: string | null;
  requestedPunchOut?: string | null;
  reason: string;
  status: CorrectionStatus;
  reviewedBy?: string | { _id: string; username: string; email: string } | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface CreateCorrectionInput {
  attendanceId: string;
  date: string;
  requestedPunchIn: string;
  requestedPunchOut?: string;
  reason: string;
}

export interface ReviewCorrectionInput {
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
}

export interface AttendanceHistoryResponse {
  records: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface BiometricImportError {
  row: number;
  email?: string;
  reason: string;
}

export interface BiometricImportResult {
  importId: string;
  fileName: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errorLog: BiometricImportError[];
  uploadedAt: string;
}

export interface BiometricImportHistoryItem {
  _id: string;
  fileName: string;
  uploadedBy: {
    _id: string;
    username: string;
    email: string;
    role?: string;
  };
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errorLog: BiometricImportError[];
  uploadedAt: string;
}
