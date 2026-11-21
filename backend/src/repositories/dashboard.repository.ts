import { Types } from "mongoose";
import { UserModel } from "../models/user.model";
import { AttendanceModel } from "../models/attendance.model";
import { PayrollModel } from "../models/payroll.model";
import { OvertimeRequestModel } from "../models/overtime.model";
import { LeaveModel } from "../models/leave.model";
import { AttendanceCorrectionModel } from "../models/attendanceCorrection.model";
import {
  DashboardStatsData,
  MonthlyPayrollPoint,
  OvertimeDepartmentBucket,
} from "../types/dashboard.types";

export class DashboardRepository {
  /**
   * Generates an array of the last N month-year keys in chronologic order.
   * e.g. for "2026-11" and count=6 => ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]
   */
  private getLastConsecutiveMonths(targetMonthYear: string, count: number = 6): string[] {
    const [yearStr, monthStr] = targetMonthYear.split("-");
    const year = parseInt(yearStr ?? "2026", 10);
    const month = parseInt(monthStr ?? "11", 10) - 1; // 0-indexed

    const months: string[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(year, month - i, 1));
      months.push(d.toISOString().slice(0, 7));
    }
    return months;
  }

  private formatMonthLabel(monthYear: string): string {
    const [yearStr, monthStr] = monthYear.split("-");
    const d = new Date(Date.UTC(parseInt(yearStr ?? "2026", 10), parseInt(monthStr ?? "1", 10) - 1, 1));
    return d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  }

  public async getAggregatedDashboardStats(
    date: string,
    monthYear: string,
    role: string,
    employeeId?: string
  ): Promise<DashboardStatsData> {
    const isEmployee = role === "EMPLOYEE" && Boolean(employeeId);
    const empObjectId = isEmployee && employeeId ? new Types.ObjectId(employeeId) : undefined;

    // Date Bounds
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const prevDateObj = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
    const prevDateStr = prevDateObj.toISOString().slice(0, 10);
    const prevStartOfDay = new Date(`${prevDateStr}T00:00:00.000Z`);
    const prevEndOfDay = new Date(`${prevDateStr}T23:59:59.999Z`);

    // Month Bounds for Overtime
    const [yearStr, monthStr] = monthYear.split("-");
    const yearNum = parseInt(yearStr ?? "2026", 10);
    const monthNum = parseInt(monthStr ?? "11", 10);
    const monthStart = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

    const prevMonthObj = new Date(Date.UTC(yearNum, monthNum - 2, 1));
    const prevMonthYear = prevMonthObj.toISOString().slice(0, 7);
    const prevMonthStart = new Date(Date.UTC(yearNum, monthNum - 2, 1, 0, 0, 0, 0));
    const prevMonthEnd = new Date(Date.UTC(yearNum, monthNum - 1, 0, 23, 59, 59, 999));

    const last6MonthKeys = this.getLastConsecutiveMonths(monthYear, 6);

    // Filters per Role
    const userMatch: Record<string, unknown> = empObjectId
      ? { _id: empObjectId, status: "ACTIVE" }
      : { status: "ACTIVE" };

    const attendanceDayMatch: Record<string, unknown> = {
      date: { $gte: startOfDay, $lte: endOfDay },
    };
    if (empObjectId) attendanceDayMatch["userId"] = empObjectId;

    const prevAttendanceDayMatch: Record<string, unknown> = {
      date: { $gte: prevStartOfDay, $lte: prevEndOfDay },
    };
    if (empObjectId) prevAttendanceDayMatch["userId"] = empObjectId;

    const payrollMatch: Record<string, unknown> = { monthYear };
    if (empObjectId) payrollMatch["userId"] = empObjectId;

    const prevPayrollMatch: Record<string, unknown> = { monthYear: prevMonthYear };
    if (empObjectId) prevPayrollMatch["userId"] = empObjectId;

    const payroll6MonthsMatch: Record<string, unknown> = {
      monthYear: { $in: last6MonthKeys },
    };
    if (empObjectId) payroll6MonthsMatch["userId"] = empObjectId;

    const overtimeMatch: Record<string, unknown> = {
      date: { $gte: monthStart, $lte: monthEnd },
      status: "APPROVED",
    };
    if (empObjectId) overtimeMatch["userId"] = empObjectId;

    const prevOvertimeMatch: Record<string, unknown> = {
      date: { $gte: prevMonthStart, $lte: prevMonthEnd },
      status: "APPROVED",
    };
    if (empObjectId) prevOvertimeMatch["userId"] = empObjectId;

    const pendingLeaveMatch: Record<string, unknown> = { status: "PENDING" };
    if (empObjectId) pendingLeaveMatch["userId"] = empObjectId;

    const pendingCorrectionMatch: Record<string, unknown> = { status: "PENDING" };
    if (empObjectId) pendingCorrectionMatch["userId"] = empObjectId;

    const pendingOvertimeMatch: Record<string, unknown> = { status: "PENDING" };
    if (empObjectId) pendingOvertimeMatch["userId"] = empObjectId;

    // Coordinated Promise.all Aggregation
    const [
      activeEmployeesCount,
      prevActiveCount,
      todayAttendanceAgg,
      prevAttendanceAgg,
      currentPayrollAgg,
      prevPayrollAgg,
      sixMonthsPayrollAgg,
      overtimeAgg,
      prevOvertimeAgg,
      overtimeDeptAgg,
      pendingLeaves,
      pendingCorrections,
      pendingOvertime,
    ] = await Promise.all([
      // 1. Headcount
      UserModel.countDocuments(userMatch),
      UserModel.countDocuments({ ...userMatch, createdAt: { $lte: monthStart } }),

      // 2. Attendance Breakdown (Today)
      AttendanceModel.aggregate([
        { $match: attendanceDayMatch },
        {
          $group: {
            _id: null,
            totalLogged: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ["$isLate", true] }, 1, 0] } },
            halfDay: { $sum: { $cond: [{ $eq: ["$status", "HALF_DAY"] }, 1, 0] } },
          },
        },
      ]),

      // 3. Attendance Breakdown (Previous Day for Trend)
      AttendanceModel.aggregate([
        { $match: prevAttendanceDayMatch },
        {
          $group: {
            _id: null,
            totalLogged: { $sum: 1 },
            present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ["$isLate", true] }, 1, 0] } },
          },
        },
      ]),

      // 4. Payroll Metrics (Current Month)
      PayrollModel.aggregate([
        { $match: payrollMatch },
        {
          $group: {
            _id: null,
            totalDisbursed: { $sum: "$netSalary" },
            totalGross: { $sum: "$baseSalary" },
            totalLopDeductions: { $sum: "$lopDeduction" },
            totalAdvanceDeductions: { $sum: "$advanceDeduction" },
            totalOvertimePay: { $sum: "$overtimePay" },
            totalCount: { $sum: 1 },
            processedCount: {
              $sum: {
                $cond: [{ $or: [{ $eq: ["$status", "FINALIZED"] }, { $eq: ["$isPaid", true] }] }, 1, 0],
              },
            },
            pendingCount: {
              $sum: {
                $cond: [{ $and: [{ $eq: ["$status", "DRAFT"] }, { $ne: ["$isPaid", true] }] }, 1, 0],
              },
            },
          },
        },
      ]),

      // 5. Payroll Metrics (Previous Month for Trend)
      PayrollModel.aggregate([
        { $match: prevPayrollMatch },
        {
          $group: {
            _id: null,
            totalDisbursed: { $sum: "$netSalary" },
          },
        },
      ]),

      // 6. Last 6 Consecutive Months Payroll Trend (for Wave Curve)
      PayrollModel.aggregate([
        { $match: payroll6MonthsMatch },
        {
          $group: {
            _id: "$monthYear",
            amount: { $sum: "$netSalary" },
          },
        },
      ]),

      // 7. Overtime Metrics (Current Month)
      OvertimeRequestModel.aggregate([
        { $match: overtimeMatch },
        {
          $group: {
            _id: null,
            totalApprovedHours: { $sum: "$hours" },
          },
        },
      ]),

      // 8. Overtime Metrics (Previous Month for Trend)
      OvertimeRequestModel.aggregate([
        { $match: prevOvertimeMatch },
        {
          $group: {
            _id: null,
            totalApprovedHours: { $sum: "$hours" },
          },
        },
      ]),

      // 9. Overtime Breakdown (by Department or Day)
      OvertimeRequestModel.aggregate([
        { $match: overtimeMatch },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ["$user.department", "General"] },
            hours: { $sum: "$hours" },
          },
        },
        { $sort: { hours: -1 } },
        { $limit: 8 },
      ]),

      // 10. Managerial Action Queue Counters
      LeaveModel.countDocuments(pendingLeaveMatch),
      AttendanceCorrectionModel.countDocuments(pendingCorrectionMatch),
      OvertimeRequestModel.countDocuments(pendingOvertimeMatch),
    ]);

    // Parse Attendance
    const todayAtt = todayAttendanceAgg[0] ?? {
      totalLogged: 0,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
    };
    const prevAtt = prevAttendanceAgg[0] ?? {
      totalLogged: 0,
      present: 0,
      absent: 0,
      late: 0,
    };

    const totalLogged = todayAtt.totalLogged || (todayAtt.present + todayAtt.absent + todayAtt.late);
    const denominator = totalLogged > 0 ? totalLogged : 1;
    const presencePercentage = Math.round((todayAtt.present / denominator) * 100);
    const absentPercentage = Math.round((todayAtt.absent / denominator) * 100);
    const latePercentage = Math.round((todayAtt.late / denominator) * 100);

    // Compute Attendance Trends
    const presentTrend = prevAtt.present > 0
      ? Math.round(((todayAtt.present - prevAtt.present) / prevAtt.present) * 100)
      : todayAtt.present > 0 ? 100 : 0;
    const absentTrend = prevAtt.absent > 0
      ? Math.round(((todayAtt.absent - prevAtt.absent) / prevAtt.absent) * 100)
      : todayAtt.absent > 0 ? 100 : 0;
    const lateTrend = prevAtt.late > 0
      ? Math.round(((todayAtt.late - prevAtt.late) / prevAtt.late) * 100)
      : todayAtt.late > 0 ? 100 : 0;

    // Parse Headcount Trend
    const headcountTrend = prevActiveCount > 0
      ? Math.round(((activeEmployeesCount - prevActiveCount) / prevActiveCount) * 100)
      : 0;

    // Parse Payroll
    const curPay = currentPayrollAgg[0] ?? {
      totalDisbursed: 0,
      totalGross: 0,
      totalLopDeductions: 0,
      totalAdvanceDeductions: 0,
      totalOvertimePay: 0,
      totalCount: 0,
      processedCount: 0,
      pendingCount: 0,
    };
    const prevPay = prevPayrollAgg[0] ?? { totalDisbursed: 0 };

    const payrollTrendPct = prevPay.totalDisbursed > 0
      ? Math.round(((curPay.totalDisbursed - prevPay.totalDisbursed) / prevPay.totalDisbursed) * 100)
      : curPay.totalDisbursed > 0 ? 100 : 0;

    const payrollTotalCount = curPay.processedCount + curPay.pendingCount;
    const processedPercentage = payrollTotalCount > 0
      ? Math.round((curPay.processedCount / payrollTotalCount) * 100)
      : (curPay.totalDisbursed > 0 ? 100 : 0);

    // Map 6 consecutive months for wave curve (filling missing months with 0)
    const sixMonthMap = new Map<string, number>();
    for (const record of sixMonthsPayrollAgg) {
      if (typeof record._id === "string") {
        sixMonthMap.set(record._id, record.amount || 0);
      }
    }

    const monthlyTrend: MonthlyPayrollPoint[] = last6MonthKeys.map((k) => ({
      month: this.formatMonthLabel(k),
      monthYear: k,
      amount: sixMonthMap.get(k) ?? 0,
    }));

    // Parse Overtime
    const totalApprovedHours = overtimeAgg[0]?.totalApprovedHours ?? 0;
    const prevApprovedHours = prevOvertimeAgg[0]?.totalApprovedHours ?? 0;
    const otTrendPct = prevApprovedHours > 0
      ? Math.round(((totalApprovedHours - prevApprovedHours) / prevApprovedHours) * 100)
      : totalApprovedHours > 0 ? 100 : 0;

    // Estimate monthly cost based on payroll overtime pay or statutory rate approximation
    const monthlyCost = curPay.totalOvertimePay || Math.round(totalApprovedHours * 300);

    const maxOtHours = Math.max(...overtimeDeptAgg.map((d: { hours: number }) => d.hours), 1);
    const departmentDistribution: OvertimeDepartmentBucket[] = overtimeDeptAgg.length > 0
      ? overtimeDeptAgg.map((d: { _id: string; hours: number }) => ({
          label: d._id || "General",
          hours: d.hours,
          percentage: Math.round((d.hours / maxOtHours) * 100),
        }))
      : [
          { label: "Engineering", hours: 0, percentage: 0 },
          { label: "Sales", hours: 0, percentage: 0 },
          { label: "Operations", hours: 0, percentage: 0 },
          { label: "Design", hours: 0, percentage: 0 },
        ];

    return {
      filters: { monthYear, date },
      kpis: {
        totalEmployees: activeEmployeesCount,
        presentToday: todayAtt.present,
        absentToday: todayAtt.absent,
        lateToday: todayAtt.late,
        halfDayToday: todayAtt.halfDay,
        presenceRate: presencePercentage,
        headcountTrend,
        presentTrend,
        absentTrend,
        lateTrend,
      },
      attendance: {
        present: todayAtt.present,
        absent: todayAtt.absent,
        late: todayAtt.late,
        halfDay: todayAtt.halfDay,
        totalLogged: todayAtt.present + todayAtt.absent + todayAtt.late + todayAtt.halfDay,
        presencePercentage,
        absentPercentage,
        latePercentage,
      },
      payroll: {
        totalDisbursed: curPay.totalDisbursed,
        totalGross: curPay.totalGross,
        totalLopDeductions: curPay.totalLopDeductions,
        totalAdvanceDeductions: curPay.totalAdvanceDeductions,
        totalOvertimePay: curPay.totalOvertimePay,
        processedCount: curPay.processedCount,
        pendingCount: curPay.pendingCount,
        processedPercentage,
        payrollTrendPct,
        monthlyTrend,
      },
      overtime: {
        totalApprovedHours,
        monthlyCost,
        otTrendPct,
        departmentDistribution,
      },
      actionQueue: {
        pendingLeaves,
        pendingCorrections,
        pendingOvertime,
        totalPending: pendingLeaves + pendingCorrections + pendingOvertime,
      },
    };
  }
}

export const dashboardRepository = new DashboardRepository();
