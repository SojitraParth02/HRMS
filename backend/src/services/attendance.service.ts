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
import { UserModel } from "../models/user.model";
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
  // Indian Standard Time (IST) offset in milliseconds (UTC+05:30)
  private readonly istOffsetMs: number = 330 * 60 * 1000;

  constructor(
    private readonly attendanceRepo: AttendanceRepository = attendanceRepository,
    private readonly correctionRepo: AttendanceCorrectionRepository = attendanceCorrectionRepository,
    private readonly settingsRepo: SettingsRepository = settingsRepository,
    private readonly notifRepo: NotificationRepository = notificationRepository,
    private readonly employeeRepo: EmployeeRepository = employeeRepository
  ) { }

  /**
   * Returns a Date object shifted to Indian Standard Time (IST) representation.
   */
  public getISTDate(date: Date = new Date()): Date {
    return new Date(date.getTime() + this.istOffsetMs);
  }

  /**
   * Returns the day of the week (0 = Sunday, 1 = Monday, ...) in Indian Standard Time (IST).
   */
  public getISTDay(date: Date = new Date()): number {
    return this.getISTDate(date).getUTCDay();
  }

  /**
   * Normalizes date to midnight representing the calendar day in Indian Standard Time (IST).
   * Stored in MongoDB as a consistent UTC midnight timestamp for that IST date.
   */
  public normalizeToMidnight(date: Date = new Date()): Date {
    const ist = this.getISTDate(date);
    const year = ist.getUTCFullYear();
    const month = ist.getUTCMonth();
    const day = ist.getUTCDate();
    return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  }

  /**
   * Constructs the exact UTC timestamp corresponding to a shift HH:mm time in IST on the given calendar day.
   */
  public getShiftDateTime(baseMidnightUTC: Date, timeStr: string): Date {
    const [hoursStr, minutesStr] = timeStr.split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    // baseMidnightUTC represents 00:00:00.000 UTC for the IST calendar day
    // In IST, 00:00:00 IST is (baseMidnightUTC - 5h 30m) in UTC
    const istMidnightUtcEpoch = baseMidnightUTC.getTime() - this.istOffsetMs;
    return new Date(istMidnightUtcEpoch + (hours * 60 + minutes) * 60 * 1000);
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
    const now = new Date();
    if (this.getISTDay(now) === 0) {
      throw new BadRequestError("Today is Sunday (Weekly Off). Punch-in is disabled.");
    }

    const today = this.normalizeToMidnight(now);
    const existing = await this.attendanceRepo.findByUserAndDate(userId, today);

    if (existing && existing.punchIn) {
      throw new BadRequestError("You have already punched in for today.");
    }

    const settings = await this.settingsRepo.getSettings();
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
    const now = new Date();
    if (this.getISTDay(now) === 0) {
      throw new BadRequestError("Today is Sunday (Weekly Off). Punch-out is disabled.");
    }

    const today = this.normalizeToMidnight(now);
    const existing = await this.attendanceRepo.findByUserAndDate(userId, today);

    if (!existing || !existing.punchIn) {
      throw new BadRequestError(
        "Cannot punch out: No punch-in record found for today."
      );
    }

    if (existing.punchOut) {
      throw new BadRequestError("You have already punched out for today.");
    }

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
  ): Promise<{
    attendance: IAttendanceDocument | null;
    settings: ICompanySettings;
    isWeekend: boolean;
    dayType: "WORK_DAY" | "WEEKLY_OFF";
  }> {
    const now = new Date();
    const isSunday = now.getDay() === 0;
    const today = this.normalizeToMidnight(now);
    const [attendance, settings] = await Promise.all([
      this.attendanceRepo.findByUserAndDate(userId, today),
      this.settingsRepo.getSettings(),
    ]);

    return {
      attendance,
      settings,
      isWeekend: isSunday,
      dayType: isSunday ? "WEEKLY_OFF" : "WORK_DAY",
    };
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
    department?: string,
    page?: number,
    limit?: number,
    search?: string
  ): Promise<{ roster: IAttendanceDocument[]; total: number }> {
    const targetDate = dateStr
      ? this.normalizeToMidnight(new Date(dateStr))
      : this.normalizeToMidnight(new Date());

    let userIds: string[] | undefined = undefined;

    if (department || (search && search.trim())) {
      const userQuery: Record<string, unknown> = {};
      if (department) {
        userQuery.department = department;
      }
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), "i");
        userQuery.$or = [
          { username: regex },
          { email: regex },
          { department: regex },
          { designation: regex },
        ];
      }
      const matchingUsers = await UserModel.find(userQuery, "_id").exec();
      userIds = matchingUsers.map((emp) => String(emp._id));
    }

    return await this.attendanceRepo.findAllRoster(targetDate, userIds, page, limit);
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
    status?: CorrectionStatus,
    page?: number,
    limit?: number
  ): Promise<{ corrections: IAttendanceCorrectionDocument[]; total: number }> {
    return await this.correctionRepo.findAllCorrections(status, page, limit);
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
