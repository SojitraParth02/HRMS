import { Types } from "mongoose";
import { AttendanceModel } from "../models/attendance.model";
import { PayrollModel } from "../models/payroll.model";
import { OvertimeRequestModel } from "../models/overtime.model";
import { reportsRepository } from "../repositories/reports.repository";

async function testReportsPipelines() {
  console.log("=================================================");
  console.log("MODULE 8 PHASE 1: AGGREGATION PIPELINES TEST");
  console.log("=================================================\n");

  let passedAll = true;

  const emp1Id = new Types.ObjectId();
  const emp2Id = new Types.ObjectId();

  // Mock Attendance Aggregate
  (AttendanceModel as any).aggregate = (pipeline: any[]) => ({
    exec: async () => {
      console.log("  [MOCK] Executing Attendance aggregation pipeline with", pipeline.length, "stages.");
      return [
        {
          records: [
            {
              _id: emp1Id,
              username: "Jane Doe",
              email: "jane.doe@hrms.com",
              department: "Engineering",
              designation: "Developer",
              totalRecordedDays: 20,
              daysPresent: 18,
              daysAbsent: 1,
              halfDays: 1,
              lateCount: 2,
              totalWorkingMinutes: 18 * 480 + 240,
            },
            {
              _id: emp2Id,
              username: "Alex Smith",
              email: "alex.smith@hrms.com",
              department: "Product",
              designation: "Manager",
              totalRecordedDays: 20,
              daysPresent: 19,
              daysAbsent: 0,
              halfDays: 1,
              lateCount: 0,
              totalWorkingMinutes: 19 * 480 + 240,
            },
          ],
          summary: [
            {
              totalRecordedDays: 40,
              totalPresentDays: 37,
              totalAbsentDays: 1,
              totalHalfDays: 2,
              totalLateCount: 2,
              uniqueUsers: [emp1Id, emp2Id],
            },
          ],
        },
      ];
    },
  });

  // Mock Payroll Aggregate
  (PayrollModel as any).aggregate = (pipeline: any[]) => ({
    exec: async () => {
      console.log("  [MOCK] Executing Payroll aggregation pipeline with", pipeline.length, "stages.");
      return [
        {
          records: [
            {
              payrollId: new Types.ObjectId(),
              userId: emp1Id,
              username: "Jane Doe",
              email: "jane.doe@hrms.com",
              department: "Engineering",
              designation: "Developer",
              baseSalary: 60000,
              lopDaysCount: 1,
              lopDeduction: 2308,
              overtimeHours: 5,
              overtimePay: 2163,
              advanceDeduction: 0,
              bonus: 2000,
              otherDeductions: 0,
              netSalary: 61855,
              status: "FINALIZED",
              isPaid: true,
              paidAt: new Date(),
              paymentMethod: "BANK_TRANSFER",
              transactionReference: "UTR987654",
            },
            {
              payrollId: new Types.ObjectId(),
              userId: emp2Id,
              username: "Alex Smith",
              email: "alex.smith@hrms.com",
              department: "Product",
              designation: "Manager",
              baseSalary: 85000,
              lopDaysCount: 0,
              lopDeduction: 0,
              overtimeHours: 0,
              overtimePay: 0,
              advanceDeduction: 5000,
              bonus: 0,
              otherDeductions: 0,
              netSalary: 80000,
              status: "FINALIZED",
              isPaid: false,
              paidAt: null,
              paymentMethod: null,
              transactionReference: null,
            },
          ],
          summary: [
            {
              totalEmployees: 2,
              totalGrossBudget: 145000 + 2163 + 2000,
              totalLopDeductions: 2308,
              totalAdvanceDeductions: 5000,
              totalBonusGiven: 2000,
              totalOvertimePaid: 2163,
              totalNetDisbursed: 141855,
              totalPaidCount: 1,
              totalUnpaidCount: 1,
            },
          ],
        },
      ];
    },
  });

  // Mock Overtime Aggregate
  (OvertimeRequestModel as any).aggregate = (pipeline: any[]) => ({
    exec: async () => {
      console.log("  [MOCK] Executing Overtime aggregation pipeline with", pipeline.length, "stages.");
      return [
        {
          records: [
            {
              userId: emp1Id,
              username: "Jane Doe",
              email: "jane.doe@hrms.com",
              department: "Engineering",
              designation: "Developer",
              monthlySalary: 60000,
              approvedHours: 12,
              submissionsCount: 3,
              hourlyRate: 288.46,
              otRate: 432.69,
              totalOtPay: 5192.28,
            },
            {
              userId: emp2Id,
              username: "Alex Smith",
              email: "alex.smith@hrms.com",
              department: "Product",
              designation: "Manager",
              monthlySalary: 85000,
              approvedHours: 6,
              submissionsCount: 1,
              hourlyRate: 408.65,
              otRate: 612.98,
              totalOtPay: 3677.88,
            },
          ],
          summary: [
            {
              uniqueEmployeesCount: 2,
              totalApprovedHours: 18,
              totalOtPayout: 8870.16,
            },
          ],
        },
      ];
    },
  });

  // 1. Test Attendance Report Pipeline
  console.log("[TEST 1] Testing getAttendanceReportData()...");
  try {
    const attData = await reportsRepository.getAttendanceReportData("2026-11-01", "2026-11-30", "Engineering");
    if (attData.records.length === 2 && attData.summary.overallPresenceRate === 92.5 && attData.summary.totalPresentDays === 37) {
      console.log("  ✓ Attendance aggregation returned formatted DTO with presenceRate:", attData.summary.overallPresenceRate + "%");
      console.log("  ✓ Total records:", attData.records.length);
    } else {
      console.error("  ✗ Attendance aggregation output unexpected:", attData);
      passedAll = false;
    }
  } catch (err: any) {
    console.error("  ✗ Error testing attendance pipeline:", err);
    passedAll = false;
  }

  // 2. Test Payroll Report Pipeline
  console.log("\n[TEST 2] Testing getPayrollReportData()...");
  try {
    const prData = await reportsRepository.getPayrollReportData("2026-11");
    if (prData.records.length === 2 && prData.summary.totalPaidCount === 1 && prData.summary.totalUnpaidCount === 1) {
      console.log("  ✓ Payroll aggregation returned formatted DTO with gross budget: ₹" + prData.summary.totalGrossBudget);
      console.log("  ✓ Total net disbursed: ₹" + prData.summary.totalNetDisbursed);
    } else {
      console.error("  ✗ Payroll aggregation output unexpected:", prData);
      passedAll = false;
    }
  } catch (err: any) {
    console.error("  ✗ Error testing payroll pipeline:", err);
    passedAll = false;
  }

  // 3. Test Overtime Report Pipeline
  console.log("\n[TEST 3] Testing getOvertimeReportData()...");
  try {
    const otData = await reportsRepository.getOvertimeReportData("2026-11");
    if (otData.records.length === 2 && otData.summary.totalApprovedHours === 18 && otData.summary.uniqueEmployeesCount === 2) {
      console.log("  ✓ Overtime aggregation returned formatted DTO with total OT hours:", otData.summary.totalApprovedHours);
      console.log("  ✓ Total OT payout: ₹" + otData.summary.totalOtPayout);
      console.log("  ✓ Avg hours/employee:", otData.summary.averageHoursPerEmployee);
    } else {
      console.error("  ✗ Overtime aggregation output unexpected:", otData);
      passedAll = false;
    }
  } catch (err: any) {
    console.error("  ✗ Error testing overtime pipeline:", err);
    passedAll = false;
  }

  console.log("\n=================================================");
  if (passedAll) {
    console.log("ALL PHASE 1 AGGREGATION PIPELINES PASSED 100%!");
  } else {
    console.log("SOME TESTS FAILED! CHECK LOGS ABOVE.");
  }
  console.log("=================================================");
}

testReportsPipelines().catch(console.error);
