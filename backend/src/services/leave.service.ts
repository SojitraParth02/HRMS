import { Types } from "mongoose";
import { leaveRepository, LeaveRepository } from "../repositories/leave.repository";
import { settingsRepository, SettingsRepository } from "../repositories/settings.repository";
import { notificationRepository, NotificationRepository } from "../repositories/notification.repository";
import { employeeRepository, EmployeeRepository } from "../repositories/employee.repository";
import { emitToHR, emitToUser } from "../socket";
import { ILeaveDocument, LeaveStatus } from "../models/leave.model";
import {
  ApplyLeaveInput,
  ReviewLeaveInput,
  LeaveBalanceSummary,
} from "../types/leave.types";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../utils/errors";

export class LeaveService {
  constructor(
    private readonly leaveRepo: LeaveRepository = leaveRepository,
    private readonly settingsRepo: SettingsRepository = settingsRepository,
    private readonly notifRepo: NotificationRepository = notificationRepository,
    private readonly employeeRepo: EmployeeRepository = employeeRepository
  ) {}

  public normalizeToMidnight(date: Date = new Date()): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  public async getLeaveBalance(userId: string): Promise<LeaveBalanceSummary> {
    const currentYear = new Date().getFullYear();
    const settings = await this.settingsRepo.getSettings();
    const yearlyPaidLeaveQuota = settings.yearlyPaidLeaveQuota ?? 5;

    const approvedLeaves = await this.leaveRepo.findApprovedLeavesInYear(
      userId,
      currentYear
    );

    let usedPaidDays = 0;
    let totalLossOfPayDays = 0;

    for (const leave of approvedLeaves) {
      usedPaidDays += leave.paidDaysCount ?? 0;
      totalLossOfPayDays += leave.lossOfPayDaysCount ?? 0;
    }

    const remainingPaidDays = Math.max(0, yearlyPaidLeaveQuota - usedPaidDays);

    return {
      yearlyPaidLeaveQuota,
      usedPaidDays,
      remainingPaidDays,
      totalLossOfPayDays,
    };
  }

  public async applyLeave(
    userId: string,
    input: ApplyLeaveInput
  ): Promise<{ leave: ILeaveDocument; balance: LeaveBalanceSummary }> {
    const startDate = this.normalizeToMidnight(new Date(input.startDate));
    const endDate =
      input.leaveType === "HALF_DAY"
        ? startDate
        : this.normalizeToMidnight(new Date(input.endDate));

    if (startDate.getTime() > endDate.getTime()) {
      throw new BadRequestError("Leave start date cannot be after end date.");
    }

    let numberOfDays = 1;
    if (input.leaveType === "HALF_DAY") {
      numberOfDays = 0.5;
    } else {
      const diffDays = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      numberOfDays = Math.max(1, diffDays);
    }

    const isOverlapping = await this.leaveRepo.hasOverlappingLeave(
      userId,
      startDate,
      endDate
    );
    if (isOverlapping) {
      throw new ConflictError(
        "You already have a pending or approved leave request overlapping with these dates."
      );
    }

    const balance = await this.getLeaveBalance(userId);
    const paidDaysCount = Math.min(balance.remainingPaidDays, numberOfDays);
    const lossOfPayDaysCount = numberOfDays - paidDaysCount;
    const isPaid = lossOfPayDaysCount === 0;

    const userObjectId = new Types.ObjectId(userId);
    const leave = await this.leaveRepo.createLeave({
      userId: userObjectId,
      startDate,
      endDate,
      leaveType: input.leaveType,
      numberOfDays,
      reason: input.reason.trim(),
      status: "PENDING",
      isPaid,
      paidDaysCount,
      lossOfPayDaysCount,
    });

    const user = await this.employeeRepo.findEmployeeById(userId);
    const dateFormatted =
      startDate.getTime() === endDate.getTime()
        ? startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

    const notification = await this.notifRepo.createNotification({
      targetRole: "HR",
      type: "LEAVE_APPLIED",
      title: "New Leave Application",
      message: `${user?.username ?? "An employee"} applied for ${numberOfDays} ${numberOfDays === 1 ? "day" : "days"} leave (${dateFormatted}).`,
      link: "/leaves",
      isRead: false,
      metadata: {
        leaveId: String(leave._id),
        userId,
        numberOfDays,
        leaveType: input.leaveType,
        isPaid,
      },
    });

    emitToHR("notification:new", notification);

    const updatedBalance: LeaveBalanceSummary = {
      ...balance,
      remainingPaidDays: Math.max(0, balance.remainingPaidDays - paidDaysCount),
    };

    return { leave, balance: updatedBalance };
  }

  public async getMyLeaves(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    records: ILeaveDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { records, total } = await this.leaveRepo.findMyLeaves(
      userId,
      page,
      limit
    );
    return { records, total, page, limit };
  }

  public async getAllLeaves(
    reviewerRole: string,
    status?: LeaveStatus,
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<{
    records: ILeaveDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    if (reviewerRole !== "HR" && reviewerRole !== "ADMIN") {
      throw new ForbiddenError(
        "Only HR and Admin are authorized to access workforce leave requests."
      );
    }

    const { records, total } = await this.leaveRepo.findAllLeaves(
      status,
      page,
      limit,
      search
    );
    return { records, total, page, limit };
  }

  public async reviewLeave(
    leaveId: string,
    reviewerId: string,
    reviewerRole: string,
    input: ReviewLeaveInput
  ): Promise<ILeaveDocument> {
    if (reviewerRole !== "HR" && reviewerRole !== "ADMIN") {
      throw new ForbiddenError(
        "Only HR and Admin are authorized to approve or reject leave requests."
      );
    }

    const leave = await this.leaveRepo.findById(leaveId);
    if (!leave) {
      throw new NotFoundError("Leave request not found.");
    }

    if (leave.status !== "PENDING") {
      throw new BadRequestError(
        `This leave request has already been ${leave.status.toLowerCase()}.`
      );
    }

    const updated = await this.leaveRepo.updateStatus(
      leaveId,
      input.status,
      reviewerId,
      new Date(),
      input.rejectionReason
    );

    if (!updated) {
      throw new NotFoundError("Failed to update leave request status.");
    }

    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const dateFormatted =
      startDate.getTime() === endDate.getTime()
        ? startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

    const notification = await this.notifRepo.createNotification({
      recipientId: leave.userId,
      targetRole: null,
      type: input.status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
      title: `Leave Request ${input.status}`,
      message: `Your ${leave.leaveType.toLowerCase().replace("_", " ")} leave request (${leave.numberOfDays} days for ${dateFormatted}) was ${input.status.toLowerCase()}${
        input.rejectionReason ? `: ${input.rejectionReason}` : "."
      }`,
      link: "/leaves",
      isRead: false,
      metadata: {
        leaveId,
        status: input.status,
      },
    });

    emitToUser(String(leave.userId), "notification:new", notification);

    return updated;
  }
}

export const leaveService = new LeaveService();
