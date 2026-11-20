import { Types, PipelineStage } from "mongoose";
import { AttendanceModel } from "../models/attendance.model";
import { PayrollModel } from "../models/payroll.model";
import { OvertimeRequestModel } from "../models/overtime.model";
import {
  AttendanceReportDTO,
  AttendanceReportRecord,
  AttendanceReportSummary,
  PayrollReportDTO,
  PayrollReportRecord,
  PayrollReportSummary,
  OvertimeReportDTO,
  OvertimeReportRecord,
  OvertimeReportSummary,
} from "../types/reports.types";

export class ReportsRepository {
  /**
   * Aggregates date-range attendance metrics per active employee and produces global KPI totals.
   */
  public async getAttendanceReportData(
    startDate: string,
    endDate: string,
    department?: string
  ): Promise<AttendanceReportDTO> {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    const userMatchFilter: Record<string, unknown> = {
      "user.status": "ACTIVE",
      "user.role": { $ne: "ADMIN" },
    };
    if (department && department.trim().length > 0) {
      userMatchFilter["user.department"] = department.trim();
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          date: { $gte: start, $lte: end },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $match: userMatchFilter,
      },
      {
        $facet: {
          records: [
            {
              $group: {
                _id: "$user._id",
                username: { $first: "$user.username" },
                email: { $first: "$user.email" },
                department: { $first: "$user.department" },
                designation: { $first: "$user.designation" },
                totalRecordedDays: { $sum: 1 },
                daysPresent: {
                  $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] },
                },
                daysAbsent: {
                  $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] },
                },
                halfDays: {
                  $sum: { $cond: [{ $eq: ["$status", "HALF_DAY"] }, 1, 0] },
                },
                lateCount: {
                  $sum: { $cond: [{ $eq: ["$isLate", true] }, 1, 0] },
                },
                totalWorkingMinutes: {
                  $sum: { $ifNull: ["$totalWorkingMinutes", 0] },
                },
              },
            },
            {
              $sort: { username: 1 },
            },
          ],
          summary: [
            {
              $group: {
                _id: null,
                totalRecordedDays: { $sum: 1 },
                totalPresentDays: {
                  $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] },
                },
                totalAbsentDays: {
                  $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] },
                },
                totalHalfDays: {
                  $sum: { $cond: [{ $eq: ["$status", "HALF_DAY"] }, 1, 0] },
                },
                totalLateCount: {
                  $sum: { $cond: [{ $eq: ["$isLate", true] }, 1, 0] },
                },
                uniqueUsers: { $addToSet: "$user._id" },
              },
            },
          ],
        },
      },
    ];

    const [result] = await AttendanceModel.aggregate(pipeline).exec();

    const rawRecords = (result?.records || []) as Array<{
      _id: Types.ObjectId;
      username: string;
      email: string;
      department: string;
      designation: string;
      totalRecordedDays: number;
      daysPresent: number;
      daysAbsent: number;
      halfDays: number;
      lateCount: number;
      totalWorkingMinutes: number;
    }>;

    const rawSummary = result?.summary?.[0] as
      | {
          totalRecordedDays: number;
          totalPresentDays: number;
          totalAbsentDays: number;
          totalHalfDays: number;
          totalLateCount: number;
          uniqueUsers: Types.ObjectId[];
        }
      | undefined;

    const records: AttendanceReportRecord[] = rawRecords.map((r) => ({
      userId: r._id.toString(),
      username: r.username,
      email: r.email,
      department: r.department || "General",
      designation: r.designation || "Staff",
      totalRecordedDays: r.totalRecordedDays,
      daysPresent: r.daysPresent,
      daysAbsent: r.daysAbsent,
      halfDays: r.halfDays,
      lateCount: r.lateCount,
      totalWorkingMinutes: r.totalWorkingMinutes,
      totalWorkingHours: Number((r.totalWorkingMinutes / 60).toFixed(1)),
    }));

    const totalRecordedDays = rawSummary?.totalRecordedDays || 0;
    const totalPresentDays = rawSummary?.totalPresentDays || 0;
    const totalAbsentDays = rawSummary?.totalAbsentDays || 0;
    const totalHalfDays = rawSummary?.totalHalfDays || 0;
    const totalLateCount = rawSummary?.totalLateCount || 0;
    const totalEmployees = rawSummary?.uniqueUsers?.length || 0;

    const overallPresenceRate =
      totalRecordedDays > 0
        ? Number(((totalPresentDays / totalRecordedDays) * 100).toFixed(1))
        : 0;

    const summary: AttendanceReportSummary = {
      totalEmployees,
      totalPresentDays,
      totalAbsentDays,
      totalHalfDays,
      totalLateCount,
      overallPresenceRate,
    };

    return { summary, records };
  }

  /**
   * Aggregates monthly payroll and salary expenditure reports per active employee and calculates total financial burn.
   */
  public async getPayrollReportData(
    monthYear: string,
    department?: string
  ): Promise<PayrollReportDTO> {
    const userMatchFilter: Record<string, unknown> = {
      "user.role": { $ne: "ADMIN" },
    };
    if (department && department.trim().length > 0) {
      userMatchFilter["user.department"] = department.trim();
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          monthYear,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $match: userMatchFilter,
      },
      {
        $facet: {
          records: [
            {
              $project: {
                payrollId: "$_id",
                userId: "$user._id",
                username: "$user.username",
                email: "$user.email",
                department: "$user.department",
                designation: "$user.designation",
                baseSalary: "$baseSalary",
                lopDaysCount: "$lopDaysCount",
                lopDeduction: "$lopDeduction",
                overtimeHours: "$overtimeHours",
                overtimePay: "$overtimePay",
                advanceDeduction: "$advanceDeduction",
                bonus: "$bonus",
                otherDeductions: "$otherDeductions",
                netSalary: "$netSalary",
                status: "$status",
                isPaid: "$isPaid",
                paidAt: "$paidAt",
                paymentMethod: "$paymentMethod",
                transactionReference: "$transactionReference",
              },
            },
            {
              $sort: { username: 1 },
            },
          ],
          summary: [
            {
              $group: {
                _id: null,
                totalEmployees: { $sum: 1 },
                totalGrossBudget: {
                  $sum: { $add: ["$baseSalary", "$overtimePay", "$bonus"] },
                },
                totalLopDeductions: { $sum: "$lopDeduction" },
                totalAdvanceDeductions: { $sum: "$advanceDeduction" },
                totalBonusGiven: { $sum: "$bonus" },
                totalOvertimePaid: { $sum: "$overtimePay" },
                totalNetDisbursed: { $sum: "$netSalary" },
                totalPaidCount: {
                  $sum: { $cond: ["$isPaid", 1, 0] },
                },
                totalUnpaidCount: {
                  $sum: { $cond: ["$isPaid", 0, 1] },
                },
              },
            },
          ],
        },
      },
    ];

    const [result] = await PayrollModel.aggregate(pipeline).exec();

    const rawRecords = (result?.records || []) as Array<{
      payrollId: Types.ObjectId;
      userId: Types.ObjectId;
      username: string;
      email: string;
      department: string;
      designation: string;
      baseSalary: number;
      lopDaysCount: number;
      lopDeduction: number;
      overtimeHours: number;
      overtimePay: number;
      advanceDeduction: number;
      bonus: number;
      otherDeductions: number;
      netSalary: number;
      status: string;
      isPaid: boolean;
      paidAt?: Date | null;
      paymentMethod?: string | null;
      transactionReference?: string | null;
    }>;

    const rawSummary = result?.summary?.[0] as
      | {
          totalEmployees: number;
          totalGrossBudget: number;
          totalLopDeductions: number;
          totalAdvanceDeductions: number;
          totalBonusGiven: number;
          totalOvertimePaid: number;
          totalNetDisbursed: number;
          totalPaidCount: number;
          totalUnpaidCount: number;
        }
      | undefined;

    const records: PayrollReportRecord[] = rawRecords.map((r) => ({
      payrollId: r.payrollId.toString(),
      userId: r.userId.toString(),
      username: r.username,
      email: r.email,
      department: r.department || "General",
      designation: r.designation || "Staff",
      baseSalary: r.baseSalary,
      lopDaysCount: r.lopDaysCount,
      lopDeduction: r.lopDeduction,
      overtimeHours: r.overtimeHours,
      overtimePay: r.overtimePay,
      advanceDeduction: r.advanceDeduction,
      bonus: r.bonus,
      otherDeductions: r.otherDeductions,
      netSalary: r.netSalary,
      status: r.status,
      isPaid: r.isPaid,
      paidAt: r.paidAt ? new Date(r.paidAt).toISOString() : null,
      paymentMethod: r.paymentMethod || null,
      transactionReference: r.transactionReference || null,
    }));

    const summary: PayrollReportSummary = {
      totalEmployees: rawSummary?.totalEmployees || 0,
      totalGrossBudget: Math.round(rawSummary?.totalGrossBudget || 0),
      totalLopDeductions: Math.round(rawSummary?.totalLopDeductions || 0),
      totalAdvanceDeductions: Math.round(rawSummary?.totalAdvanceDeductions || 0),
      totalBonusGiven: Math.round(rawSummary?.totalBonusGiven || 0),
      totalOvertimePaid: Math.round(rawSummary?.totalOvertimePaid || 0),
      totalNetDisbursed: Math.round(rawSummary?.totalNetDisbursed || 0),
      totalPaidCount: rawSummary?.totalPaidCount || 0,
      totalUnpaidCount: rawSummary?.totalUnpaidCount || 0,
    };

    return { summary, records };
  }

  /**
   * Aggregates approved overtime hours and computes 1.5x statutory compensation per employee for the month.
   */
  public async getOvertimeReportData(
    monthYear: string,
    department?: string
  ): Promise<OvertimeReportDTO> {
    const [year, month] = monthYear.split("-").map(Number);
    const startMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const userMatchFilter: Record<string, unknown> = {
      "user.role": { $ne: "ADMIN" },
    };
    if (department && department.trim().length > 0) {
      userMatchFilter["user.department"] = department.trim();
    }

    const pipeline: PipelineStage[] = [
      {
        $match: {
          status: "APPROVED",
          $or: [
            { payrollCycle: monthYear },
            { date: { $gte: startMonth, $lte: endMonth } },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $match: userMatchFilter,
      },
      {
        $group: {
          _id: "$user._id",
          username: { $first: "$user.username" },
          email: { $first: "$user.email" },
          department: { $first: "$user.department" },
          designation: { $first: "$user.designation" },
          monthlySalary: { $first: "$user.monthlySalary" },
          approvedHours: { $sum: "$hours" },
          submissionsCount: { $sum: 1 },
        },
      },
      {
        $facet: {
          records: [
            {
              $project: {
                userId: "$_id",
                username: 1,
                email: 1,
                department: 1,
                designation: 1,
                monthlySalary: 1,
                approvedHours: 1,
                submissionsCount: 1,
                hourlyRate: {
                  $round: [{ $divide: ["$monthlySalary", 208.0] }, 2],
                },
                otRate: {
                  $round: [
                    { $multiply: [{ $divide: ["$monthlySalary", 208.0] }, 1.5] },
                    2,
                  ],
                },
                totalOtPay: {
                  $round: [
                    {
                      $multiply: [
                        "$approvedHours",
                        {
                          $multiply: [
                            { $divide: ["$monthlySalary", 208.0] },
                            1.5,
                          ],
                        },
                      ],
                    },
                    2,
                  ],
                },
              },
            },
            {
              $sort: { username: 1 },
            },
          ],
          summary: [
            {
              $group: {
                _id: null,
                uniqueEmployeesCount: { $sum: 1 },
                totalApprovedHours: { $sum: "$approvedHours" },
                totalOtPayout: {
                  $sum: {
                    $multiply: [
                      "$approvedHours",
                      {
                        $multiply: [
                          { $divide: ["$monthlySalary", 208.0] },
                          1.5,
                        ],
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ];

    const [result] = await OvertimeRequestModel.aggregate(pipeline).exec();

    const rawRecords = (result?.records || []) as Array<{
      userId: Types.ObjectId;
      username: string;
      email: string;
      department: string;
      designation: string;
      monthlySalary: number;
      approvedHours: number;
      submissionsCount: number;
      hourlyRate: number;
      otRate: number;
      totalOtPay: number;
    }>;

    const rawSummary = result?.summary?.[0] as
      | {
          uniqueEmployeesCount: number;
          totalApprovedHours: number;
          totalOtPayout: number;
        }
      | undefined;

    const records: OvertimeReportRecord[] = rawRecords.map((r) => ({
      userId: r.userId.toString(),
      username: r.username,
      email: r.email,
      department: r.department || "General",
      designation: r.designation || "Staff",
      monthlySalary: r.monthlySalary,
      approvedHours: r.approvedHours,
      submissionsCount: r.submissionsCount,
      hourlyRate: r.hourlyRate,
      otRate: r.otRate,
      totalOtPay: r.totalOtPay,
    }));

    const uniqueEmployeesCount = rawSummary?.uniqueEmployeesCount || 0;
    const totalApprovedHours = Number((rawSummary?.totalApprovedHours || 0).toFixed(1));
    const totalOtPayout = Math.round(rawSummary?.totalOtPayout || 0);
    const averageHoursPerEmployee =
      uniqueEmployeesCount > 0
        ? Number((totalApprovedHours / uniqueEmployeesCount).toFixed(1))
        : 0;

    const summary: OvertimeReportSummary = {
      uniqueEmployeesCount,
      totalApprovedHours,
      totalOtPayout,
      averageHoursPerEmployee,
    };

    return { summary, records };
  }
}

export const reportsRepository = new ReportsRepository();
