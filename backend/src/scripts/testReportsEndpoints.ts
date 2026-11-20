import { reportsService } from "../services/reports.service";
import { reportsController } from "../controllers/reports.controller";
import reportsRouter from "../routes/reports.routes";

async function testReportsEndpoints() {
  console.log("=================================================");
  console.log("MODULE 8 PHASE 2: SERVICE & CONTROLLER AUDIT");
  console.log("=================================================\n");

  let passedAll = true;

  // Mock repository methods
  const mockRepo = (reportsService as any).repo;
  mockRepo.getAttendanceReportData = async (start: string, end: string, dept?: string) => ({
    summary: {
      totalEmployees: 5,
      totalPresentDays: 95,
      totalAbsentDays: 5,
      totalHalfDays: 2,
      totalLateCount: 4,
      overallPresenceRate: 95.0,
    },
    records: [
      {
        userId: "673ca80220108db3cf5f8010",
        username: "Jane Doe",
        email: "jane.doe@hrms.com",
        department: dept || "Engineering",
        designation: "Developer",
        totalRecordedDays: 20,
        daysPresent: 19,
        daysAbsent: 1,
        halfDays: 0,
        lateCount: 1,
        totalWorkingMinutes: 9120,
        totalWorkingHours: 152.0,
      },
    ],
  });

  mockRepo.getPayrollReportData = async (monthYear: string, dept?: string) => ({
    summary: {
      totalEmployees: 10,
      totalGrossBudget: 750000,
      totalLopDeductions: 12500,
      totalAdvanceDeductions: 20000,
      totalBonusGiven: 15000,
      totalOvertimePaid: 8500,
      totalNetDisbursed: 741000,
      totalPaidCount: 8,
      totalUnpaidCount: 2,
    },
    records: [
      {
        payrollId: "673ca80220108db3cf5f8099",
        userId: "673ca80220108db3cf5f8010",
        username: "Jane Doe",
        email: "jane.doe@hrms.com",
        department: dept || "Engineering",
        designation: "Developer",
        baseSalary: 60000,
        lopDaysCount: 0,
        lopDeduction: 0,
        overtimeHours: 4,
        overtimePay: 1730,
        advanceDeduction: 0,
        bonus: 5000,
        otherDeductions: 0,
        netSalary: 66730,
        status: "FINALIZED",
        isPaid: true,
        paidAt: new Date().toISOString(),
        paymentMethod: "BANK_TRANSFER",
        transactionReference: "UTR112233",
      },
    ],
  });

  mockRepo.getOvertimeReportData = async (monthYear: string, dept?: string) => ({
    summary: {
      uniqueEmployeesCount: 4,
      totalApprovedHours: 45.5,
      totalOtPayout: 23500,
      averageHoursPerEmployee: 11.4,
    },
    records: [
      {
        userId: "673ca80220108db3cf5f8010",
        username: "Jane Doe",
        email: "jane.doe@hrms.com",
        department: dept || "Engineering",
        designation: "Developer",
        approvedHours: 10,
        monthlySalary: 60000,
        hourlyRate: 288.46,
        otRate: 432.69,
        totalOtPay: 4326.9,
        submissionsCount: 2,
      },
    ],
  });

  // 1. Test Attendance Report Validation & Retrieval
  console.log("[TEST 1] Testing Service: getAttendanceReport()...");
  try {
    // Bad format
    await reportsService.getAttendanceReport("invalid-date", "2026-11-30");
    console.error("  ✗ Failed to reject invalid date format.");
    passedAll = false;
  } catch (err: any) {
    console.log("  ✓ Correctly rejected invalid date format: " + err.message);
  }

  try {
    // start > end
    await reportsService.getAttendanceReport("2026-12-01", "2026-11-01");
    console.error("  ✗ Failed to reject start date after end date.");
    passedAll = false;
  } catch (err: any) {
    console.log("  ✓ Correctly rejected start date after end date: " + err.message);
  }

  try {
    // Success call
    const res = await reportsService.getAttendanceReport("2026-11-01", "2026-11-30", "Engineering");
    if (res.summary.overallPresenceRate === 95 && res.records[0].department === "Engineering") {
      console.log("  ✓ Successfully retrieved attendance report for Engineering with 95% presence rate.");
    } else {
      console.error("  ✗ Unexpected attendance report data:", res);
      passedAll = false;
    }
  } catch (err: any) {
    console.error("  ✗ Unexpected error in getAttendanceReport:", err);
    passedAll = false;
  }

  // 2. Test Payroll Report Validation & Retrieval
  console.log("\n[TEST 2] Testing Service: getPayrollReport()...");
  try {
    // Bad monthYear
    await reportsService.getPayrollReport("2026-11-01"); // expects YYYY-MM
    console.error("  ✗ Failed to reject non-YYYY-MM format.");
    passedAll = false;
  } catch (err: any) {
    console.log("  ✓ Correctly rejected non-YYYY-MM format: " + err.message);
  }

  try {
    const res = await reportsService.getPayrollReport("2026-11");
    if (res.summary.totalGrossBudget === 750000 && res.records[0].netSalary === 66730) {
      console.log("  ✓ Successfully retrieved payroll report with Gross Budget ₹750,000.");
    } else {
      console.error("  ✗ Unexpected payroll report data:", res);
      passedAll = false;
    }
  } catch (err: any) {
    console.error("  ✗ Unexpected error in getPayrollReport:", err);
    passedAll = false;
  }

  // 3. Test Overtime Report Validation & Retrieval
  console.log("\n[TEST 3] Testing Service: getOvertimeReport()...");
  try {
    const res = await reportsService.getOvertimeReport("2026-11");
    if (res.summary.totalApprovedHours === 45.5 && res.summary.totalOtPayout === 23500) {
      console.log("  ✓ Successfully retrieved overtime report with 45.5 hrs and ₹23,500 payout.");
    } else {
      console.error("  ✗ Unexpected overtime report data:", res);
      passedAll = false;
    }
  } catch (err: any) {
    console.error("  ✗ Unexpected error in getOvertimeReport:", err);
    passedAll = false;
  }

  // 4. Test Controller Layer
  console.log("\n[TEST 4] Testing Controller Response Formatting...");
  let capturedStatus = 0;
  let capturedJson: any = null;
  const mockRes: any = {
    status: (code: number) => {
      capturedStatus = code;
      return mockRes;
    },
    json: (body: any) => {
      capturedJson = body;
      return mockRes;
    },
  };

  await reportsController.getPayrollReport(
    { query: { monthYear: "2026-11" } } as any,
    mockRes
  );

  if (capturedStatus === 200 && capturedJson?.status === "success" && capturedJson?.data?.summary) {
    console.log("  ✓ Controller returned HTTP 200 with standardized response { status: 'success', data: { summary, records } }.");
  } else {
    console.error("  ✗ Controller response invalid:", { capturedStatus, capturedJson });
    passedAll = false;
  }

  // 5. Test Express Route Mounting
  console.log("\n[TEST 5] Verifying /api/reports Router Layer...");
  const routerStack = (reportsRouter as any).stack;
  const routePaths = routerStack
    ?.filter((layer: any) => layer.route)
    ?.map((layer: any) => layer.route.path);

  if (
    routePaths.includes("/attendance") &&
    routePaths.includes("/payroll") &&
    routePaths.includes("/overtime")
  ) {
    console.log("  ✓ reportsRouter registers /attendance, /payroll, and /overtime sub-routes.");
  } else {
    console.error("  ✗ Missing expected routes:", routePaths);
    passedAll = false;
  }

  console.log("\n=================================================");
  if (passedAll) {
    console.log("ALL PHASE 2 SERVICE & CONTROLLER TESTS PASSED 100%!");
  } else {
    console.log("SOME TESTS FAILED! CHECK LOGS ABOVE.");
  }
  console.log("=================================================");
}

testReportsEndpoints().catch(console.error);
