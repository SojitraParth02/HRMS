export interface CompanySettings {
  shiftStartTime: string;
  shiftEndTime: string;
  graceWindowEndTime: string;
  standardWorkHoursPerDay: number;
  lunchStartTime: string;
  lunchEndTime: string;
  yearlyPaidLeaveQuota: number;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateCompanySettingsPayload {
  shiftStartTime?: string;
  shiftEndTime?: string;
  graceWindowEndTime?: string;
  standardWorkHoursPerDay?: number;
  lunchStartTime?: string;
  lunchEndTime?: string;
  yearlyPaidLeaveQuota?: number;
}
