import { Types } from "mongoose";
import {
  payrollRepository,
  PayrollRepository,
} from "../repositories/payroll.repository";
import {
  employeeRepository,
  EmployeeRepository,
} from "../repositories/employee.repository";
import {
  leaveRepository,
  LeaveRepository,
} from "../repositories/leave.repository";
import {
  overtimeRepository,
  OvertimeRepository,
} from "../repositories/overtime.repository";
import {
  salaryAdvanceRepository,
  SalaryAdvanceRepository,
} from "../repositories/salaryAdvance.repository";
import {
  notificationRepository,
  NotificationRepository,
} from "../repositories/notification.repository";
import { emitToUser } from "../socket";
import {
  IPayrollDocument,
  PayrollStatus,
} from "../models/payroll.model";
import {
  AdjustPayrollInput,
  PayrollQueryFilters,
} from "../types/payroll.types";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../utils/errors";

export class PayrollService {
  constructor(
    private readonly payrollRepo: PayrollRepository = payrollRepository,
    private readonly employeeRepo: EmployeeRepository = employeeRepository,
    private readonly leaveRepo: LeaveRepository = leaveRepository,
    private readonly overtimeRepo: OvertimeRepository = overtimeRepository,
    private readonly advanceRepo: SalaryAdvanceRepository = salaryAdvanceRepository,
    private readonly notifRepo: NotificationRepository = notificationRepository
  ) {}

  public getMonthDateRange(monthYear: string): {
    startDate: Date;
    endDate: Date;
  } {
    const [yearStr, monthStr] = monthYear.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    return { startDate, endDate };
  }

  public async runPayrollDraft(
    monthYear: string,
    generatedById: string
  ): Promise<IPayrollDocument[]> {
    // 1. Check if payroll for this month has already been finalized
    const existingFinalized = await this.payrollRepo.findPayrollByMonth(
      monthYear,
      "FINALIZED"
    );
    if (existingFinalized.length > 0) {
      throw new BadRequestError(
        `Payroll for ${monthYear} has already been finalized and locked against recalculations.`
      );
    }

    // 2. Fetch all active employees (excluding ADMIN who are company owners)
    const allEmployees = await this.employeeRepo.getAllEmployees();
    const activeEmployees = allEmployees.filter(
      (emp) => emp.status === "ACTIVE" && emp.role !== "ADMIN"
    );

    if (activeEmployees.length === 0) {
      throw new BadRequestError("No eligible active employees found to run payroll.");
    }

    // Cleanup any existing draft payroll records for Admin users if previously created
    const adminUserIds = allEmployees
      .filter((emp) => emp.role === "ADMIN")
      .map((a) => a._id);
    if (adminUserIds.length > 0) {
      await this.payrollRepo.deleteDraftsForUsers(adminUserIds, monthYear);
    }

    const { startDate, endDate } = this.getMonthDateRange(monthYear);
    const generatedByObjectId = new Types.ObjectId(generatedById);

    // 3. Compute 26-Day Divisor Payroll Math for each active employee
    for (const employee of activeEmployees) {
      const userId = String(employee._id);
      const baseSalary = employee.monthlySalary || 0;
      const workingDaysStandard = 26;

      // Statutory 26-Day Divisor Math
      const perDayRate = Math.round((baseSalary / 26.0) * 100) / 100;
      const hourlyRate = Math.round((perDayRate / 8.0) * 100) / 100;

      // Query Approved Leaves for LOP deduction
      const leaves = await this.leaveRepo.findApprovedLeavesInDateRange(
        userId,
        startDate,
        endDate
      );
      const lopDaysCount = leaves.reduce(
        (sum, l) => sum + (l.lossOfPayDaysCount || 0),
        0
      );
      const lopDeduction = Math.round(lopDaysCount * perDayRate * 100) / 100;

      // Query Approved Overtime for OT Pay
      const overtimes = await this.overtimeRepo.findApprovedOvertimeByDateRange(
        userId,
        startDate,
        endDate
      );
      const overtimeHours = overtimes.reduce((sum, ot) => sum + ot.hours, 0);
      const overtimeHourlyRate = Math.round(hourlyRate * 1.5 * 100) / 100;
      const overtimePay =
        Math.round(overtimeHours * overtimeHourlyRate * 100) / 100;

      // Query In-Month Undeducted Salary Advances
      const advances = await this.advanceRepo.findUndeductedAdvancesForUser(
        userId,
        monthYear
      );
      const advanceDeduction = advances.reduce(
        (sum, a) => sum + a.amount,
        0
      );

      // Check existing draft record to preserve any manual adjustments
      const existing = await this.payrollRepo.findByUserAndMonth(
        userId,
        monthYear
      );
      const bonus = existing?.bonus || 0;
      const otherDeductions = existing?.otherDeductions || 0;
      const notes = existing?.notes || "";

      // Net Salary Formula
      const grossEarnings = baseSalary + overtimePay + bonus;
      const totalDeductions = lopDeduction + advanceDeduction + otherDeductions;
      const netSalary = Math.max(
        0,
        Math.round((grossEarnings - totalDeductions) * 100) / 100
      );

      // Save/Upsert Draft Record
      await this.payrollRepo.upsertDraftPayroll(userId, monthYear, {
        userId: new Types.ObjectId(userId),
        monthYear,
        status: "DRAFT",
        baseSalary,
        perDayRate,
        hourlyRate,
        workingDaysStandard,
        lopDaysCount,
        lopDeduction,
        overtimeHours,
        overtimeHourlyRate,
        overtimePay,
        advanceDeduction,
        bonus,
        otherDeductions,
        netSalary,
        generatedBy: generatedByObjectId,
        notes,
      });
    }

    return await this.payrollRepo.findPayrollByMonth(monthYear);
  }

  public async updatePayrollAdjustment(
    id: string,
    input: AdjustPayrollInput
  ): Promise<IPayrollDocument> {
    const record = await this.payrollRepo.findPayrollById(id);
    if (!record) {
      throw new NotFoundError("Payroll record not found.");
    }

    if (record.status === "FINALIZED") {
      throw new BadRequestError(
        "Cannot modify a finalized and locked payroll record."
      );
    }

    const bonus = input.bonus !== undefined ? input.bonus : record.bonus;
    const otherDeductions =
      input.otherDeductions !== undefined
        ? input.otherDeductions
        : record.otherDeductions;
    const notes = input.notes !== undefined ? input.notes : record.notes;

    const grossEarnings = record.baseSalary + record.overtimePay + bonus;
    const totalDeductions =
      record.lopDeduction + record.advanceDeduction + otherDeductions;
    const netSalary = Math.max(
      0,
      Math.round((grossEarnings - totalDeductions) * 100) / 100
    );

    const updated = await this.payrollRepo.updatePayrollAdjustment(
      id,
      bonus,
      otherDeductions,
      netSalary,
      notes
    );

    if (!updated) {
      throw new NotFoundError("Failed to update payroll adjustment.");
    }

    return updated;
  }

  public async finalizePayroll(
    monthYear: string,
    finalizedById: string
  ): Promise<{ finalizedCount: number; monthYear: string }> {
    const drafts = await this.payrollRepo.findPayrollByMonth(
      monthYear,
      "DRAFT"
    );

    if (drafts.length === 0) {
      throw new BadRequestError(
        `No draft payroll records found for ${monthYear} to finalize.`
      );
    }

    const finalizedAt = new Date();
    const finalizedByObjectId = new Types.ObjectId(finalizedById);

    // 1. Transition all DRAFT records for monthYear to FINALIZED
    const finalizedCount = await this.payrollRepo.finalizePayrollMonth(
      monthYear,
      finalizedByObjectId,
      finalizedAt
    );

    // 2. Mark linked in-month advances as isDeducted and notify each employee
    for (const draft of drafts) {
      const recipientId = String(
        (draft.userId as { _id?: Types.ObjectId })._id || draft.userId
      );

      // Link and deduct advances
      const employeeAdvances =
        await this.advanceRepo.findUndeductedAdvancesForUser(
          recipientId,
          monthYear
        );

      if (employeeAdvances.length > 0) {
        const advanceIds = employeeAdvances.map((adv) => String(adv._id));
        await this.advanceRepo.markAdvancesAsDeducted(
          advanceIds,
          draft._id
        );
      }

      // Send Real-Time Payslip Notification to Employee
      const notification = await this.notifRepo.createNotification({
        recipientId: new Types.ObjectId(recipientId),
        targetRole: null,
        type: "PAYROLL_FINALIZED",
        title: "Monthly Payslip Ready",
        message: `Your payslip for ${monthYear} has been finalized and is now available for download.`,
        link: "/payroll",
        isRead: false,
        metadata: {
          payrollId: String(draft._id),
          monthYear,
          netSalary: draft.netSalary,
        },
      });

      emitToUser(recipientId, "notification:new", notification);
    }

    return { finalizedCount, monthYear };
  }

  public async getPayrollRecords(
    filters: PayrollQueryFilters
  ): Promise<IPayrollDocument[]> {
    if (filters.monthYear) {
      return await this.payrollRepo.findPayrollByMonth(
        filters.monthYear,
        filters.status
      );
    }
    // Default to current month-year if none specified
    const currentMonthYear = new Date().toISOString().slice(0, 7);
    return await this.payrollRepo.findPayrollByMonth(
      currentMonthYear,
      filters.status
    );
  }

  public async getUserPayslips(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ records: IPayrollDocument[]; total: number; page: number; limit: number }> {
    const user = await this.employeeRepo.findEmployeeById(userId);
    if (user?.role === "ADMIN") {
      return { records: [], total: 0, page, limit };
    }

    const { records, total } = await this.payrollRepo.findUserPayslips(
      userId,
      page,
      limit
    );
    return { records, total, page, limit };
  }

  public async getPayslipDetails(
    id: string,
    requestingUser: { id: string; role: string }
  ): Promise<IPayrollDocument> {
    const record = await this.payrollRepo.findPayrollById(id);
    if (!record) {
      throw new NotFoundError("Payslip record not found.");
    }

    const employeeId = String(
      (record.userId as { _id?: Types.ObjectId })._id || record.userId
    );

    if (
      requestingUser.role === "EMPLOYEE" &&
      employeeId !== requestingUser.id
    ) {
      throw new ForbiddenError(
        "You are not authorized to view another employee's payslip."
      );
    }

    if (
      requestingUser.role === "EMPLOYEE" &&
      record.status !== "FINALIZED"
    ) {
      throw new ForbiddenError(
        "Draft payslips are under review and not yet available for download."
      );
    }

    return record;
  }
}

export const payrollService = new PayrollService();
