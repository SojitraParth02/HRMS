import {
  reportsRepository,
  ReportsRepository,
} from "../repositories/reports.repository";
import {
  attendanceReportQuerySchema,
  monthlyReportQuerySchema,
  AttendanceReportDTO,
  PayrollReportDTO,
  OvertimeReportDTO,
} from "../types/reports.types";
import { BadRequestError } from "../utils/errors";

export class ReportsService {
  constructor(
    private readonly repo: ReportsRepository = reportsRepository
  ) {}

  /**
   * Retrieves date-range attendance reporting with aggregated presence percentages and working hours.
   */
  public async getAttendanceReport(
    startDateStr: unknown,
    endDateStr: unknown,
    department?: unknown
  ): Promise<AttendanceReportDTO> {
    const parseResult = attendanceReportQuerySchema.safeParse({
      startDate: startDateStr,
      endDate: endDateStr,
      department:
        typeof department === "string" && department.trim().length > 0
          ? department.trim()
          : undefined,
    });

    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((e) => e.message).join(", ");
      throw new BadRequestError(`Invalid attendance report query: ${errorMsg}`);
    }

    const { startDate, endDate, department: dept } = parseResult.data;
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestError("Start date cannot be after end date.");
    }

    return await this.repo.getAttendanceReportData(startDate, endDate, dept);
  }

  /**
   * Retrieves monthly payroll and salary expenditure report with rounded currency totals and disbursement counts.
   */
  public async getPayrollReport(
    monthYearStr: unknown,
    department?: unknown
  ): Promise<PayrollReportDTO> {
    const parseResult = monthlyReportQuerySchema.safeParse({
      monthYear: monthYearStr,
      department:
        typeof department === "string" && department.trim().length > 0
          ? department.trim()
          : undefined,
    });

    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((e) => e.message).join(", ");
      throw new BadRequestError(`Invalid payroll report query: ${errorMsg}`);
    }

    const { monthYear, department: dept } = parseResult.data;
    return await this.repo.getPayrollReportData(monthYear, dept);
  }

  /**
   * Retrieves monthly overtime utilization report with certified 1.5x compensation calculations.
   */
  public async getOvertimeReport(
    monthYearStr: unknown,
    department?: unknown
  ): Promise<OvertimeReportDTO> {
    const parseResult = monthlyReportQuerySchema.safeParse({
      monthYear: monthYearStr,
      department:
        typeof department === "string" && department.trim().length > 0
          ? department.trim()
          : undefined,
    });

    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues.map((e) => e.message).join(", ");
      throw new BadRequestError(`Invalid overtime report query: ${errorMsg}`);
    }

    const { monthYear, department: dept } = parseResult.data;
    return await this.repo.getOvertimeReportData(monthYear, dept);
  }
}

export const reportsService = new ReportsService();
