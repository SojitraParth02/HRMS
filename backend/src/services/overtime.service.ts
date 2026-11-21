import { Types } from "mongoose";
import {
  overtimeRepository,
  OvertimeRepository,
} from "../repositories/overtime.repository";
import {
  notificationRepository,
  NotificationRepository,
} from "../repositories/notification.repository";
import {
  employeeRepository,
  EmployeeRepository,
} from "../repositories/employee.repository";
import { emitToHR, emitToUser } from "../socket";
import {
  IOvertimeRequestDocument,
  OvertimeStatus,
} from "../models/overtime.model";
import {
  CreateOvertimeInput,
  ReviewOvertimeInput,
  OvertimeFilters,
} from "../types/overtime.types";
import { BadRequestError, NotFoundError } from "../utils/errors";

export class OvertimeService {
  constructor(
    private readonly overtimeRepo: OvertimeRepository = overtimeRepository,
    private readonly notifRepo: NotificationRepository = notificationRepository,
    private readonly employeeRepo: EmployeeRepository = employeeRepository
  ) {}

  public calculateOvertimeHours(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const diffMinutes = endMinutes - startMinutes;
    if (diffMinutes <= 0) {
      throw new BadRequestError(
        "End time must be later than start time for overtime."
      );
    }

    const hours = Math.round((diffMinutes / 60) * 10) / 10;
    if (hours < 0.1) {
      throw new BadRequestError(
        "Overtime duration must be at least 6 minutes (0.1 hours)."
      );
    }

    return hours;
  }

  public async submitOvertime(
    userId: string,
    input: CreateOvertimeInput
  ): Promise<IOvertimeRequestDocument> {
    const hours = this.calculateOvertimeHours(input.startTime, input.endTime);

    const normalizedDate = new Date(input.date);
    normalizedDate.setHours(0, 0, 0, 0);

    const userObjectId = new Types.ObjectId(userId);
    const employee = await this.employeeRepo.findEmployeeById(userId);
    if (!employee) {
      throw new NotFoundError("Applicant employee not found.");
    }

    if (employee.role === "ADMIN") {
      throw new BadRequestError("Admin/Owner accounts are not eligible for overtime compensation.");
    }

    const applicantName = employee.username || "Employee";

    const overtime = await this.overtimeRepo.createOvertimeRequest({
      userId: userObjectId,
      date: normalizedDate,
      startTime: input.startTime,
      endTime: input.endTime,
      hours,
      taskDescription: input.taskDescription,
      status: "PENDING",
    });

    const dateFormatted = normalizedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Notify HR / Admin room
    const notification = await this.notifRepo.createNotification({
      recipientId: null,
      targetRole: "HR",
      type: "OVERTIME_REQUESTED",
      title: "New Overtime Request",
      message: `${applicantName} submitted ${hours}h overtime for ${dateFormatted}: "${input.taskDescription}"`,
      link: "/payroll",
      isRead: false,
      metadata: {
        overtimeId: String(overtime._id),
        userId,
        applicantName,
        hours,
        date: normalizedDate.toISOString(),
      },
    });

    emitToHR("notification:new", notification);

    return overtime;
  }

  public async reviewOvertime(
    id: string,
    reviewerId: string,
    input: ReviewOvertimeInput
  ): Promise<IOvertimeRequestDocument> {
    const overtime = await this.overtimeRepo.findOvertimeById(id);
    if (!overtime) {
      throw new NotFoundError("Overtime request not found.");
    }

    if (overtime.status !== "PENDING") {
      throw new BadRequestError(
        `This overtime request has already been ${overtime.status.toLowerCase()}.`
      );
    }

    const reviewerObjectId = new Types.ObjectId(reviewerId);
    const updated = await this.overtimeRepo.updateOvertimeReview(
      id,
      input.status,
      reviewerObjectId,
      new Date(),
      input.rejectionReason
    );

    if (!updated) {
      throw new NotFoundError("Failed to update overtime review status.");
    }

    const dateFormatted = new Date(overtime.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    // Notify Applicant
    const notification = await this.notifRepo.createNotification({
      recipientId: overtime.userId,
      targetRole: null,
      type:
        input.status === "APPROVED"
          ? "OVERTIME_APPROVED"
          : "OVERTIME_REJECTED",
      title: `Overtime Request ${input.status}`,
      message: `Your overtime request for ${overtime.hours}h on ${dateFormatted} was ${input.status.toLowerCase()}${
        input.rejectionReason ? `: ${input.rejectionReason}` : "."
      }`,
      link: "/payroll",
      isRead: false,
      metadata: {
        overtimeId: id,
        status: input.status,
      },
    });

    emitToUser(String(overtime.userId), "notification:new", notification);

    return updated;
  }

  public async getMyOvertime(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    records: IOvertimeRequestDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { records, total } = await this.overtimeRepo.findMyOvertime(
      userId,
      page,
      limit
    );
    return { records, total, page, limit };
  }

  public async getAllOvertime(
    filters: OvertimeFilters
  ): Promise<{
    records: IOvertimeRequestDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;

    const startDate = filters.startDate ? new Date(filters.startDate) : undefined;
    const endDate = filters.endDate ? new Date(filters.endDate) : undefined;

    const { records, total } = await this.overtimeRepo.findAllOvertime(
      {
        status: filters.status,
        startDate,
        endDate,
        userId: filters.userId,
        search: filters.search,
      },
      page,
      limit
    );

    return { records, total, page, limit };
  }
}

export const overtimeService = new OvertimeService();
