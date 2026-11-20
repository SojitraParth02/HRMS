import { Types } from "mongoose";
import {
  attendanceRepository,
  AttendanceRepository,
} from "../repositories/attendance.repository";
import {
  attendanceCorrectionRepository,
  AttendanceCorrectionRepository,
} from "../repositories/attendanceCorrection.repository";
import {
  settingsRepository,
  SettingsRepository,
} from "../repositories/settings.repository";
import {
  notificationRepository,
  NotificationRepository,
} from "../repositories/notification.repository";
import { employeeRepository, EmployeeRepository } from "../repositories/employee.repository";
import { emitToHR, emitToUser } from "../socket";
import {
  IAttendance,
  IAttendanceDocument,
  AttendanceStatus,
} from "../models/attendance.model";
import {
  IAttendanceCorrectionDocument,
  CorrectionStatus,
} from "../models/attendanceCorrection.model";
import { ICompanySettings } from "../models/settings.model";
import {
  CreateCorrectionInput,
  ReviewCorrectionInput,
} from "../types/attendance.types";
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../utils/errors";

export class AttendanceService {
  constructor(
    private readonly attendanceRepo: AttendanceRepository = attendanceRepository,
    private readonly correctionRepo: AttendanceCorrectionRepository = attendanceCorrectionRepository,
    private readonly settingsRepo: SettingsRepository = settingsRepository,
    private readonly notifRepo: NotificationRepository = notificationRepository,
    private readonly employeeRepo: EmployeeRepository = employeeRepository
  ) { }

  public normalizeToMidnight(date: Date = new Date()): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  public getShiftDateTime(baseDate: Date, timeStr: string): Date {
    const [hoursStr, minutesStr] = timeStr.split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const dt = new Date(baseDate);
    dt.setHours(hours, minutes, 0, 0);
    return dt;
  }

  public calculatePunchInMetrics(
    punchIn: Date,
    settings: ICompanySettings
  ): {
    isLate: boolean;
    lateMinutes: number;
    flexMinutesOwed: number;
    expectedPunchOut: Date;
  } {
    const baseDate = this.normalizeToMidnight(punchIn);
    const shiftStart = this.getShiftDateTime(baseDate, settings.shiftStartTime);
    const graceEnd = this.getShiftDateTime(
      baseDate,
      settings.graceWindowEndTime
    );
    const shiftEnd = this.getShiftDateTime(baseDate, settings.shiftEndTime);

    let isLate = false;
    let lateMinutes = 0;
    let flexMinutesOwed = 0;
    let expectedPunchOut: Date = shiftEnd;

    if (punchIn.getTime() <= shiftStart.getTime()) {
      isLate = false;
      lateMinutes = 0;
      flexMinutesOwed = 0;
      expectedPunchOut = shiftEnd;
    } else if (punchIn.getTime() <= graceEnd.getTime()) {
      isLate = false;
      lateMinutes = 0;
      flexMinutesOwed = Math.round(
        (punchIn.getTime() - shiftStart.getTime()) / (60 * 1000)
      );
      expectedPunchOut = new Date(
        shiftEnd.getTime() + flexMinutesOwed * 60 * 1000
      );
    } else {
      isLate = true;
      // Late minutes are counted strictly beyond the grace period cutoff
      lateMinutes = Math.round(
        (punchIn.getTime() - graceEnd.getTime()) / (60 * 1000)
      );
      // Grace period flex minutes owed (e.g. 30 mins)
      flexMinutesOwed = Math.round(
        (graceEnd.getTime() - shiftStart.getTime()) / (60 * 1000)
      );
      expectedPunchOut = new Date(
        shiftEnd.getTime() + flexMinutesOwed * 60 * 1000
      );
    }

    return { isLate, lateMinutes, flexMinutesOwed, expectedPunchOut };
  }

  public calculatePunchOutMetrics(
    punchIn: Date,
    punchOut: Date,
    expectedPunchOut: Date | null
  ): {
    totalWorkingMinutes: number;
    status: AttendanceStatus;
    isCompensated: boolean;
    earlyLeavingMinutes: number;
  } {
    const grossMinutes = Math.round(
      (punchOut.getTime() - punchIn.getTime()) / (60 * 1000)
    );
    // Company lunch hour is 60 minutes if worked at least 5 hours (300 mins)
    const lunchDeduction = grossMinutes >= 300 ? 60 : 0;
    const totalWorkingMinutes = Math.max(0, grossMinutes - lunchDeduction);

    let status: AttendanceStatus = "PRESENT";
    let isCompensated = false;
    let earlyLeavingMinutes = 0;

    if (expectedPunchOut && punchOut.getTime() < expectedPunchOut.getTime()) {
      earlyLeavingMinutes = Math.round(
        (expectedPunchOut.getTime() - punchOut.getTime()) / (60 * 1000)
      );
    }

    if (totalWorkingMinutes < 240) {
      status = "ABSENT";
    } else if (totalWorkingMinutes < 420) {
      status = "HALF_DAY";
    } else {
      if (expectedPunchOut) {
        isCompensated = punchOut.getTime() >= expectedPunchOut.getTime();
        status =
          isCompensated || totalWorkingMinutes >= 480 ? "PRESENT" : "HALF_DAY";
      } else {
        isCompensated = true;
        status = "PRESENT";
      }
    }

    return { totalWorkingMinutes, status, isCompensated, earlyLeavingMinutes };
  }

  public async punchIn(userId: string): Promise<IAttendanceDocument> {
    const today = this.normalizeToMidnight(new Date());
    const existing = await this.attendanceRepo.findByUserAndDate(userId, today);

    if (existing && existing.punchIn) {
      throw new BadRequestError("You have already punched in for today.");
    }

    const settings = await this.settingsRepo.getSettings();
    const now = new Date();
    const metrics = this.calculatePunchInMetrics(now, settings);

    if (existing) {
      const updated = await this.attendanceRepo.updateAttendance(
        String(existing._id),
        {
          punchIn: now,
          status: "PRESENT",
          isLate: metrics.isLate,
          lateMinutes: metrics.lateMinutes,
          flexMinutesOwed: metrics.flexMinutesOwed,
          expectedPunchOut: metrics.expectedPunchOut,
          isCompensated: false,
        }
      );
      if (!updated) {
        throw new NotFoundError("Failed to update attendance record.");
      }
      return updated;
    }

    const userObjectId = new Types.ObjectId(userId);
    return await this.attendanceRepo.createAttendance({
      userId: userObjectId,
      date: today,
      punchIn: now,
      status: "PRESENT",
      isLate: metrics.isLate,
      lateMinutes: metrics.lateMinutes,
      flexMinutesOwed: metrics.flexMinutesOwed,
      expectedPunchOut: metrics.expectedPunchOut,
      isCompensated: false,
      totalWorkingMinutes: 0,
      isCorrected: false,
    });
  }

  public async punchOut(userId: string): Promise<IAttendanceDocument> {
    const today = this.normalizeToMidnight(new Date());
    const existing = await this.attendanceRepo.findByUserAndDate(userId, today);

    if (!existing || !existing.punchIn) {
      throw new BadRequestError(
        "Cannot punch out: No punch-in record found for today."
      );
    }

    if (existing.punchOut) {
      throw new BadRequestError("You have already punched out for today.");
    }

    const now = new Date();
    const metrics = this.calculatePunchOutMetrics(
      existing.punchIn,
      now,
      existing.expectedPunchOut
    );

    const updated = await this.attendanceRepo.updateAttendance(
      String(existing._id),
      {
        punchOut: now,
        status: metrics.status,
        totalWorkingMinutes: metrics.totalWorkingMinutes,
        isCompensated: metrics.isCompensated,
        earlyLeavingMinutes: metrics.earlyLeavingMinutes,
      }
    );

    if (!updated) {
      throw new NotFoundError("Failed to record punch out.");
    }

    return updated;
  }

  public async getTodayAttendance(
    userId: string
  ): Promise<{ attendance: IAttendanceDocument | null; settings: ICompanySettings }> {
    const today = this.normalizeToMidnight(new Date());
    const [attendance, settings] = await Promise.all([
      this.attendanceRepo.findByUserAndDate(userId, today),
      this.settingsRepo.getSettings(),
    ]);

    return { attendance, settings };
  }

  public async getMyHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    startDateStr?: string,
    endDateStr?: string
  ): Promise<{
    records: IAttendanceDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const { records, total } = await this.attendanceRepo.findHistoryByUser(
      userId,
      page,
      limit,
      startDate,
      endDate
    );

    return { records, total, page, limit };
  }

  public async getAllAttendanceRoster(
    dateStr?: string,
    department?: string
  ): Promise<IAttendanceDocument[]> {
    const targetDate = dateStr
      ? this.normalizeToMidnight(new Date(dateStr))
      : this.normalizeToMidnight(new Date());

    let userIds: string[] | undefined = undefined;

    if (department) {
      const allEmployees = await this.employeeRepo.getAllEmployees();
      const filtered = allEmployees.filter(
        (emp) => emp.department.toLowerCase() === department.toLowerCase()
      );
      userIds = filtered.map((emp) => String(emp._id));
    }

    return await this.attendanceRepo.findAllRoster(targetDate, userIds);
  }

  public async submitCorrectionRequest(
    userId: string,
    input: CreateCorrectionInput
  ): Promise<IAttendanceCorrectionDocument> {
    const attendance = await this.attendanceRepo.findById(input.attendanceId);
    if (!attendance) {
      throw new NotFoundError("Attendance record not found.");
    }

    if (String(attendance.userId) !== userId) {
      throw new ForbiddenError(
        "You are not authorized to request corrections for this attendance record."
      );
    }

    const pending = await this.correctionRepo.findPendingByAttendanceId(
      input.attendanceId
    );
    if (pending) {
      throw new ConflictError(
        "A pending correction request already exists for this attendance record."
      );
    }

    const userObjectId = new Types.ObjectId(userId);
    const attendanceObjectId = new Types.ObjectId(input.attendanceId);
    const parsedRequestedPunchIn = new Date(input.requestedPunchIn);
    const parsedRequestedPunchOut = input.requestedPunchOut
      ? new Date(input.requestedPunchOut)
      : attendance.punchOut;

    const correction = await this.correctionRepo.createCorrection({
      attendanceId: attendanceObjectId,
      userId: userObjectId,
      date: attendance.date,
      originalPunchIn: attendance.punchIn ?? new Date(),
      requestedPunchIn: parsedRequestedPunchIn,
      originalPunchOut: attendance.punchOut,
      requestedPunchOut: parsedRequestedPunchOut,
      reason: input.reason.trim(),
      status: "PENDING",
    });

    const user = await this.employeeRepo.findEmployeeById(userId);
    const dateFormatted = new Date(attendance.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Create Notification and Broadcast to HR Room
    const notification = await this.notifRepo.createNotification({
      targetRole: "HR",
      type: "CORRECTION_REQUESTED",
      title: "Attendance Correction Request",
      message: `${user?.username ?? "An employee"} submitted an attendance correction for ${dateFormatted}.`,
      link: "/attendance",
      isRead: false,
      metadata: {
        attendanceId: String(attendance._id),
        correctionId: String(correction._id),
        userId,
      },
    });

    emitToHR("notification:new", notification);

    return correction;
  }

  public async getCorrections(
    status?: CorrectionStatus
  ): Promise<IAttendanceCorrectionDocument[]> {
    return await this.correctionRepo.findAllCorrections(status);
  }

  public async reviewCorrection(
    correctionId: string,
    reviewerId: string,
    reviewerRole: string,
    input: ReviewCorrectionInput
  ): Promise<IAttendanceCorrectionDocument> {
    if (reviewerRole !== "HR" && reviewerRole !== "ADMIN") {
      throw new ForbiddenError(
        "Only HR and Admin can approve or reject attendance corrections."
      );
    }

    const correction = await this.correctionRepo.findById(correctionId);
    if (!correction) {
      throw new NotFoundError("Attendance correction request not found.");
    }

    if (correction.status !== "PENDING") {
      throw new BadRequestError(
        `This correction request has already been ${correction.status.toLowerCase()}.`
      );
    }

    if (input.status === "APPROVED") {
      const attendance = await this.attendanceRepo.findById(
        String(correction.attendanceId)
      );

      if (attendance) {
        const settings = await this.settingsRepo.getSettings();
        const newPunchIn = new Date(correction.requestedPunchIn);
        const metrics = this.calculatePunchInMetrics(newPunchIn, settings);

        const newPunchOut =
          correction.requestedPunchOut ?? attendance.punchOut;

        let totalWorkingMinutes = attendance.totalWorkingMinutes;
        let status: AttendanceStatus = attendance.status;
        let isCompensated = attendance.isCompensated;
        let earlyLeavingMinutes = attendance.earlyLeavingMinutes ?? 0;

        if (newPunchOut) {
          const outMetrics = this.calculatePunchOutMetrics(
            newPunchIn,
            new Date(newPunchOut),
            metrics.expectedPunchOut
          );
          totalWorkingMinutes = outMetrics.totalWorkingMinutes;
          status = outMetrics.status;
          isCompensated = outMetrics.isCompensated;
          earlyLeavingMinutes = outMetrics.earlyLeavingMinutes;
        }

        await this.attendanceRepo.updateAttendance(String(attendance._id), {
          punchIn: newPunchIn,
          punchOut: newPunchOut,
          isLate: metrics.isLate,
          lateMinutes: metrics.lateMinutes,
          flexMinutesOwed: metrics.flexMinutesOwed,
          expectedPunchOut: metrics.expectedPunchOut,
          earlyLeavingMinutes,
          totalWorkingMinutes,
          status,
          isCompensated,
          isCorrected: true,
          correctionRequestId: correction._id,
        });
      }
    }

    const updatedCorrection = await this.correctionRepo.updateStatus(
      correctionId,
      input.status,
      reviewerId,
      new Date(),
      input.rejectionReason
    );

    if (!updatedCorrection) {
      throw new NotFoundError("Failed to update correction status.");
    }

    const dateFormatted = new Date(correction.date).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    );

    // Notify Applicant
    const notification = await this.notifRepo.createNotification({
      recipientId: correction.userId,
      targetRole: null,
      type:
        input.status === "APPROVED"
          ? "CORRECTION_APPROVED"
          : "CORRECTION_REJECTED",
      title: `Attendance Correction ${input.status}`,
      message: `Your attendance correction for ${dateFormatted} was ${input.status.toLowerCase()}${input.rejectionReason ? `: ${input.rejectionReason}` : "."
        }`,
      link: "/attendance",
      isRead: false,
      metadata: {
        correctionId,
        attendanceId: String(correction.attendanceId),
        status: input.status,
      },
    });

    emitToUser(String(correction.userId), "notification:new", notification);

    return updatedCorrection;
  }
}

export const attendanceService = new AttendanceService();
