import { Types } from "mongoose";
import {
  salaryAdvanceRepository,
  SalaryAdvanceRepository,
} from "../repositories/salaryAdvance.repository";
import {
  employeeRepository,
  EmployeeRepository,
} from "../repositories/employee.repository";
import {
  notificationRepository,
  NotificationRepository,
} from "../repositories/notification.repository";
import { emitToUser } from "../socket";
import { ISalaryAdvanceDocument } from "../models/salaryAdvance.model";
import {
  CreateAdvanceInput,
  AdvanceFilters,
} from "../types/salaryAdvance.types";
import { BadRequestError, NotFoundError } from "../utils/errors";

export class SalaryAdvanceService {
  constructor(
    private readonly advanceRepo: SalaryAdvanceRepository = salaryAdvanceRepository,
    private readonly employeeRepo: EmployeeRepository = employeeRepository,
    private readonly notifRepo: NotificationRepository = notificationRepository
  ) {}

  public async logAdvance(
    issuerId: string,
    input: CreateAdvanceInput
  ): Promise<ISalaryAdvanceDocument> {
    const employee = await this.employeeRepo.findEmployeeById(input.userId);
    if (!employee) {
      throw new NotFoundError("Employee recipient not found.");
    }

    if (employee.role === "ADMIN") {
      throw new BadRequestError("Salary advances cannot be issued to Admin/Owner accounts.");
    }

    if (input.amount <= 0) {
      throw new BadRequestError("Advance amount must be greater than zero.");
    }

    const disbursementDate = input.date ? new Date(input.date) : new Date();

    const advance = await this.advanceRepo.createSalaryAdvance({
      userId: new Types.ObjectId(input.userId),
      givenBy: new Types.ObjectId(issuerId),
      amount: input.amount,
      reason: input.reason,
      monthYear: input.monthYear,
      date: disbursementDate,
      isDeducted: false,
      payrollId: null,
    });

    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(input.amount);

    // Notify Recipient Employee
    const notification = await this.notifRepo.createNotification({
      recipientId: new Types.ObjectId(input.userId),
      targetRole: null,
      type: "ADVANCE_LOGGED",
      title: "Salary Advance Logged",
      message: `A salary advance of ${formattedAmount} has been logged for payroll cycle ${input.monthYear}. Reason: ${input.reason}`,
      link: "/payroll",
      isRead: false,
      metadata: {
        advanceId: String(advance._id),
        amount: input.amount,
        monthYear: input.monthYear,
      },
    });

    emitToUser(input.userId, "notification:new", notification);

    return advance;
  }

  public async getAllAdvances(
    filters: AdvanceFilters
  ): Promise<{
    records: ISalaryAdvanceDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;

    const { records, total } = await this.advanceRepo.findAllAdvances(
      {
        monthYear: filters.monthYear,
        isDeducted: filters.isDeducted,
        userId: filters.userId,
      },
      page,
      limit
    );

    return { records, total, page, limit };
  }

  public async getMyAdvances(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    records: ISalaryAdvanceDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { records, total } = await this.advanceRepo.findAdvancesByUser(
      userId,
      page,
      limit
    );
    return { records, total, page, limit };
  }
}

export const salaryAdvanceService = new SalaryAdvanceService();
