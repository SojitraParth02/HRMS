import http from "http";
import { Types } from "mongoose";
import { PayrollModel } from "../models/payroll.model";
import { NotificationModel } from "../models/notification.model";
import { PayrollService } from "../services/payroll.service";
import * as socketGateway from "../socket";

async function runDisbursementVerification() {
  console.log("=================================================");
  console.log("SALARY DISBURSEMENT WORKFLOW TEST & VERIFICATION");
  console.log("=================================================\n");

  let passedAll = true;

  // 1. Schema Invariant Checks
  console.log("[TEST 1] Verifying PayrollModel & NotificationModel Schema paths...");
  const prPaths = Object.keys(PayrollModel.schema.paths);
  const hasIsPaid = prPaths.includes("isPaid");
  const hasPaidAt = prPaths.includes("paidAt");
  const hasPaymentMethod = prPaths.includes("paymentMethod");
  const hasTxRef = prPaths.includes("transactionReference");
  const hasPaidBy = prPaths.includes("paidBy");
  const paidByRef = (PayrollModel.schema.paths.paidBy as any)?.options?.ref;

  if (hasIsPaid && hasPaidAt && hasPaymentMethod && hasTxRef && hasPaidBy && paidByRef === "User") {
    console.log("  ✓ PayrollModel correctly defines isPaid, paidAt, paymentMethod, transactionReference, and paidBy (ref: User).");
  } else {
    console.error("  ✗ PayrollModel schema fields verification failed:", {
      hasIsPaid, hasPaidAt, hasPaymentMethod, hasTxRef, hasPaidBy, paidByRef
    });
    passedAll = false;
  }

  const notifEnumValues = (NotificationModel.schema.paths.type as any)?.enumValues || [];
  if (notifEnumValues.includes("SALARY_DISBURSED")) {
    console.log("  ✓ NotificationModel includes 'SALARY_DISBURSED' in NotificationType enum.");
  } else {
    console.error("  ✗ NotificationModel missing 'SALARY_DISBURSED':", notifEnumValues);
    passedAll = false;
  }

  // 2. Initialize Socket.io Server & Spy
  const server = http.createServer();
  const io = socketGateway.initSocketServer(server);
  const emittedEvents: Array<{ channel: string; event: string; payload: any }> = [];

  io.to = (room: string | string[]) => {
    const channelName = Array.isArray(room) ? room.join(",") : room;
    return {
      emit: (event: string, payload: any) => {
        emittedEvents.push({ channel: channelName, event, payload });
        console.log(`    [Socket.io -> '${channelName}'] Event: '${event}' | Type: '${payload?.type}' | Message: "${payload?.message}"`);
        return true;
      },
    } as any;
  };

  const employeeId1 = new Types.ObjectId();
  const employeeId2 = new Types.ObjectId();
  const adminId = new Types.ObjectId();

  const dbPayroll: any[] = [
    {
      _id: new Types.ObjectId(),
      userId: employeeId1,
      monthYear: "2026-11",
      baseSalary: 60000,
      perDayRate: 60000 / 26,
      hourlyRate: 60000 / 26 / 8,
      workingDaysStandard: 26,
      lopDaysCount: 0,
      lopDeduction: 0,
      overtimeHours: 0,
      overtimePay: 0,
      advanceDeduction: 0,
      bonus: 0,
      otherDeductions: 0,
      netSalary: 60000,
      status: "DRAFT",
      isPaid: false,
      paidAt: null,
      paymentMethod: null,
      transactionReference: null,
      paidBy: null,
      generatedBy: adminId,
    },
    {
      _id: new Types.ObjectId(),
      userId: employeeId2,
      monthYear: "2026-11",
      baseSalary: 75000,
      perDayRate: 75000 / 26,
      hourlyRate: 75000 / 26 / 8,
      workingDaysStandard: 26,
      lopDaysCount: 0,
      lopDeduction: 0,
      overtimeHours: 0,
      overtimePay: 0,
      advanceDeduction: 0,
      bonus: 5000,
      otherDeductions: 0,
      netSalary: 80000,
      status: "FINALIZED",
      finalizedBy: adminId,
      finalizedAt: new Date(),
      isPaid: false,
      paidAt: null,
      paymentMethod: null,
      transactionReference: null,
      paidBy: null,
      generatedBy: adminId,
    }
  ];

  const dbNotifications: any[] = [];

  const mockPayrollRepo: any = {
    findPayrollById: async (id: string | Types.ObjectId) => {
      return dbPayroll.find((p) => p._id.toString() === id.toString()) || null;
    },
    findPayrollByMonth: async (monthYear: string, status?: string) => {
      return dbPayroll.filter((p) => {
        if (p.monthYear !== monthYear) return false;
        if (status && p.status !== status) return false;
        return true;
      });
    },
    markRecordPaid: async (
      id: string | Types.ObjectId,
      paidBy: Types.ObjectId,
      paidAt: Date,
      paymentMethod: string,
      transactionReference?: string
    ) => {
      const record = dbPayroll.find((p) => p._id.toString() === id.toString());
      if (record) {
        record.isPaid = true;
        record.paidBy = paidBy;
        record.paidAt = paidAt;
        record.paymentMethod = paymentMethod;
        record.transactionReference = transactionReference || null;
        return record;
      }
      return null;
    },
    markMonthPaid: async (
      monthYear: string,
      paidBy: Types.ObjectId,
      paidAt: Date,
      paymentMethod: string,
      transactionReference?: string
    ) => {
      let count = 0;
      for (const p of dbPayroll) {
        if (p.monthYear === monthYear && p.status === "FINALIZED" && !p.isPaid) {
          p.isPaid = true;
          p.paidBy = paidBy;
          p.paidAt = paidAt;
          p.paymentMethod = paymentMethod;
          p.transactionReference = transactionReference || null;
          count++;
        }
      }
      return count;
    }
  };

  const mockNotifRepo: any = {
    createNotification: async (data: any) => {
      const doc = { _id: new Types.ObjectId(), ...data, isRead: false, createdAt: new Date() };
      dbNotifications.push(doc);
      return doc;
    }
  };

  const mockEmployeeRepo: any = {
    findUserById: async (id: string | Types.ObjectId) => {
      return { _id: id, role: "EMPLOYEE", status: "ACTIVE" };
    }
  };

  const mockLeaveRepo: any = {};
  const mockOvertimeRepo: any = {};
  const mockAdvanceRepo: any = {};

  const payrollService = new PayrollService(
    mockPayrollRepo,
    mockLeaveRepo,
    mockOvertimeRepo,
    mockAdvanceRepo,
    mockEmployeeRepo,
    mockNotifRepo
  );

  // 3. Test: Guard against paying DRAFT record
  console.log("\n[TEST 2] Testing Business Guard: Reject disbursement on DRAFT payroll...");
  try {
    await payrollService.markRecordPaid(
      dbPayroll[0]._id.toString(),
      { paymentMethod: "BANK_TRANSFER", transactionReference: "UTR987654321" },
      adminId.toString()
    );
    console.error("  ✗ Failed: DRAFT record was marked as paid without throwing an error!");
    passedAll = false;
  } catch (err: any) {
    if (err.message.includes("Only finalized payroll records can be marked as paid")) {
      console.log("  ✓ Correctly rejected disbursement with 400 Bad Request: " + err.message);
    } else {
      console.error("  ✗ Threw unexpected error:", err.message);
      passedAll = false;
    }
  }

  // 4. Test: Successfully mark FINALIZED record as PAID
  console.log("\n[TEST 3] Testing Individual Disbursement on FINALIZED payroll...");
  try {
    const paidRecord = await payrollService.markRecordPaid(
      dbPayroll[1]._id.toString(),
      { paymentMethod: "UPI", transactionReference: "UPI-REF-00129" },
      adminId.toString()
    );

    if (paidRecord.isPaid === true && paidRecord.paymentMethod === "UPI" && paidRecord.transactionReference === "UPI-REF-00129" && paidRecord.paidBy) {
      console.log(`  ✓ Successfully disbursed salary for employee ${employeeId2.toString()}.`);
      console.log(`    isPaid: ${paidRecord.isPaid}, paymentMethod: ${paidRecord.paymentMethod}, UTR: ${paidRecord.transactionReference}`);
    } else {
      console.error("  ✗ Returned record did not have paid fields updated:", paidRecord);
      passedAll = false;
    }

    // Check DB notification & Socket.io event
    const notif = dbNotifications.find((n) => n.recipientId.toString() === employeeId2.toString() && n.type === "SALARY_DISBURSED");
    const socketEvent = emittedEvents.find((e) => e.channel === `user_${employeeId2.toString()}` && e.payload?.type === "SALARY_DISBURSED");

    if (notif && socketEvent) {
      console.log("  ✓ Successfully created 'SALARY_DISBURSED' DB notification and emitted real-time 'notification:new' via Socket.io.");
    } else {
      console.error("  ✗ Missing notification or socket event:", { notif, socketEvent, emittedEvents });
      passedAll = false;
    }
  } catch (err: any) {
    console.error("  ✗ Unexpected error paying record:", err);
    passedAll = false;
  }

  // 5. Test: Idempotency Guard: Cannot re-pay already paid record
  console.log("\n[TEST 4] Testing Idempotency Guard: Cannot re-pay already paid record...");
  try {
    await payrollService.markRecordPaid(
      dbPayroll[1]._id.toString(),
      { paymentMethod: "CASH" },
      adminId.toString()
    );
    console.error("  ✗ Failed: Allowed re-paying already paid record!");
    passedAll = false;
  } catch (err: any) {
    if (err.message.includes("already been marked as paid")) {
      console.log("  ✓ Correctly prevented double payout: " + err.message);
    } else {
      console.error("  ✗ Threw unexpected error:", err.message);
      passedAll = false;
    }
  }

  // 6. Test: Bulk Disbursement
  console.log("\n[TEST 5] Testing Bulk Monthly Disbursement (POST /api/payroll/pay-month)...");
  // Finalize the first record so it becomes eligible for payment
  dbPayroll[0].status = "FINALIZED";
  dbPayroll[0].finalizedBy = adminId;
  dbPayroll[0].finalizedAt = new Date();

  // Add a third finalized record
  const employeeId3 = new Types.ObjectId();
  dbPayroll.push({
    _id: new Types.ObjectId(),
    userId: employeeId3,
    monthYear: "2026-11",
    baseSalary: 52000,
    perDayRate: 52000 / 26,
    hourlyRate: 52000 / 26 / 8,
    workingDaysStandard: 26,
    lopDaysCount: 0,
    lopDeduction: 0,
    overtimeHours: 0,
    overtimePay: 0,
    advanceDeduction: 0,
    bonus: 0,
    otherDeductions: 0,
    netSalary: 52000,
    status: "FINALIZED",
    finalizedBy: adminId,
    finalizedAt: new Date(),
    isPaid: false,
    paidAt: null,
    paymentMethod: null,
    transactionReference: null,
    paidBy: null,
    generatedBy: adminId,
  });

  try {
    const bulkResult = await payrollService.markMonthPaid(
      { monthYear: "2026-11", paymentMethod: "BANK_TRANSFER", transactionReference: "BATCH-CORP-NOV" },
      adminId.toString()
    );

    if (bulkResult.disbursedCount === 2 && bulkResult.monthYear === "2026-11") {
      console.log(`  ✓ Bulk disbursement successfully processed ${bulkResult.disbursedCount} records for ${bulkResult.monthYear}.`);
      console.log(`  ✓ Records already paid (employeeId2) were safely excluded from double disbursement.`);
    } else {
      console.error("  ✗ Bulk disbursement unexpected result:", bulkResult);
      passedAll = false;
    }

    const notifEmp1 = dbNotifications.find((n) => n.recipientId.toString() === employeeId1.toString() && n.type === "SALARY_DISBURSED");
    const notifEmp3 = dbNotifications.find((n) => n.recipientId.toString() === employeeId3.toString() && n.type === "SALARY_DISBURSED");

    if (notifEmp1 && notifEmp3) {
      console.log("  ✓ All employees in bulk batch received individual SALARY_DISBURSED notifications.");
    } else {
      console.error("  ✗ Missing bulk notifications:", { notifEmp1, notifEmp3 });
      passedAll = false;
    }
  } catch (err: any) {
    console.error("  ✗ Bulk disbursement error:", err);
    passedAll = false;
  }

  console.log("\n=================================================");
  if (passedAll) {
    console.log("ALL DISBURSEMENT TESTS PASSED WITH 100% SUCCESS!");
  } else {
    console.log("SOME TESTS FAILED! CHECK LOGS ABOVE.");
  }
  console.log("=================================================");
}

runDisbursementVerification().catch(console.error);
