import { Types } from "mongoose";
import { BiometricImportService } from "../services/biometricImport.service";
import { AttendanceService } from "../services/attendance.service";
import { AttendanceModel } from "../models/attendance.model";
import { UserModel } from "../models/user.model";

async function runBiometricImportTest() {
  console.log("=================================================");
  console.log("MODULE 4: BIOMETRIC CSV IMPORT ENGINE E2E AUDIT");
  console.log("=================================================\n");

  let passedAll = true;

  // 1. Mock Settings and Users
  const adminId = new Types.ObjectId();
  const user1Id = new Types.ObjectId();
  const user2Id = new Types.ObjectId();
  const user3Id = new Types.ObjectId();

  const mockUsers = [
    {
      _id: user1Id,
      email: "jane.doe@hrms.com",
      username: "Jane Doe",
      department: "Engineering",
      designation: "Developer",
      status: "ACTIVE",
    },
    {
      _id: user2Id,
      email: "alex.smith@hrms.com",
      username: "Alex Smith",
      department: "Product",
      designation: "Manager",
      status: "ACTIVE",
    },
    {
      _id: user3Id,
      email: "rahul.sharma@hrms.com",
      username: "Rahul Sharma",
      department: "HR",
      designation: "Generalist",
      status: "ACTIVE",
    },
  ];

  // Intercept UserModel.find
  (UserModel as any).find = () => ({
    select: async () => mockUsers,
  });

  const savedAttendance: any[] = [];
  (AttendanceModel as any).findOneAndUpdate = async (
    query: any,
    update: any,
    _opts: any
  ) => {
    const existingIdx = savedAttendance.findIndex(
      (a) =>
        a.userId.toString() === query.userId.toString() &&
        a.date.getTime() === query.date.getTime()
    );
    const data = update.$set;
    if (existingIdx !== -1) {
      savedAttendance[existingIdx] = { ...savedAttendance[existingIdx], ...data };
      return savedAttendance[existingIdx];
    } else {
      const doc = { _id: new Types.ObjectId(), ...data };
      savedAttendance.push(doc);
      return doc;
    }
  };

  const savedImports: any[] = [];
  const mockImportRepo: any = {
    createImportLog: async (data: any) => {
      const doc = { _id: new Types.ObjectId(), ...data };
      savedImports.push(doc);
      return doc;
    },
    getImportHistory: async () => savedImports,
  };

  const mockSettingsRepo: any = {
    getSettings: async () => ({
      shiftStartTime: "09:00",
      shiftEndTime: "18:00",
      graceWindowEndTime: "09:30",
      standardWorkHoursPerDay: 8,
      lunchStartTime: "12:00",
      lunchEndTime: "13:00",
      yearlyPaidLeaveQuota: 5,
    }),
  };

  const attendanceSvc = new AttendanceService();
  const importService = new BiometricImportService(
    mockImportRepo,
    mockSettingsRepo,
    attendanceSvc
  );

  // -------------------------------------------------------------
  // TEST 1: Process Sample 5-Row CSV + 1 Duplicate Row + 1 Unregistered Row
  // -------------------------------------------------------------
  console.log("[TEST 1] Parsing Biometric CSV with mixed scenarios...");

  const csvContent = `Email,Date,PunchIn,PunchOut
jane.doe@hrms.com,2026-11-20,09:00,18:00
alex.smith@hrms.com,2026-11-20,09:18,18:20
rahul.sharma@hrms.com,2026-11-20,09:45,18:30
jane.doe@hrms.com,2026-11-21,09:00,14:00
alex.smith@hrms.com,2026-11-21,09:00,
jane.doe@hrms.com,2026-11-20,09:05,18:05
ghost.user@hrms.com,2026-11-20,09:00,18:00
`;

  try {
    const result = await importService.importCSV(
      Buffer.from(csvContent, "utf-8"),
      "sample_biometric_attendance.csv",
      adminId.toString()
    );

    console.log(`  ✓ Total data rows parsed: ${result.totalRows}`);
    console.log(`  ✓ Successful rows imported: ${result.successfulRows}`);
    console.log(`  ✓ Failed / Skipped rows: ${result.failedRows}`);

    if (result.totalRows === 7 && result.successfulRows === 5 && result.failedRows === 2) {
      console.log("  ✓ Correctly imported 5 valid rows and flagged 2 corrupt/duplicate rows.");
    } else {
      console.error("  ✗ Row count mismatch:", result);
      passedAll = false;
    }

    // Check duplicate error
    const dupErr = result.errorLog.find((e) => e.reason.includes("Duplicate attendance entry"));
    if (dupErr && dupErr.email === "jane.doe@hrms.com" && dupErr.row === 7) {
      console.log(`  ✓ Duplicate detection caught row #${dupErr.row} for ${dupErr.email}.`);
    } else {
      console.error("  ✗ Missing duplicate error log:", dupErr);
      passedAll = false;
    }

    // Check unregistered user error
    const unknownErr = result.errorLog.find((e) => e.reason.includes("not found in active staff roster"));
    if (unknownErr && unknownErr.email === "ghost.user@hrms.com" && unknownErr.row === 8) {
      console.log(`  ✓ Unrecognized employee rejection caught row #${unknownErr.row} for ${unknownErr.email}.`);
    } else {
      console.error("  ✗ Missing unknown user error log:", unknownErr);
      passedAll = false;
    }

    // -------------------------------------------------------------
    // TEST 2: Verify Metrics for Valid Records
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Verifying generated Attendance records and metrics...");

    // 2a. On-time punch: Jane Doe on 2026-11-20 (09:00 - 18:00)
    const rec1 = savedAttendance.find(
      (a) => a.userId.toString() === user1Id.toString() && a.punchIn.getHours() === 9 && a.punchOut?.getHours() === 18
    );
    if (rec1 && rec1.status === "PRESENT" && !rec1.isLate && rec1.totalWorkingMinutes === 480) {
      console.log("  ✓ Record 1 (On-time, 09:00 - 18:00): status=PRESENT, isLate=false, totalWorkingMinutes=480 (8 hrs).");
    } else {
      console.error("  ✗ Record 1 failed metrics verification:", rec1);
      passedAll = false;
    }

    // 2b. Flex Grace punch: Alex Smith on 2026-11-20 (09:18 - 18:20)
    const rec2 = savedAttendance.find(
      (a) => a.userId.toString() === user2Id.toString() && a.punchIn.getMinutes() === 18
    );
    if (rec2 && rec2.status === "PRESENT" && !rec2.isLate && rec2.flexMinutesOwed === 18 && rec2.isCompensated) {
      console.log("  ✓ Record 2 (Flex Grace, 09:18 - 18:20): status=PRESENT, isLate=false, flexMinutesOwed=18, isCompensated=true.");
    } else {
      console.error("  ✗ Record 2 failed flex metrics verification:", rec2);
      passedAll = false;
    }

    // 2c. Strict Late punch: Rahul Sharma on 2026-11-20 (09:45 - 18:30)
    const rec3 = savedAttendance.find(
      (a) => a.userId.toString() === user3Id.toString() && a.punchIn.getMinutes() === 45
    );
    if (rec3 && rec3.isLate && rec3.lateMinutes === 15 && rec3.flexMinutesOwed === 30) {
      console.log("  ✓ Record 3 (Strict Late, 09:45 - 18:30): isLate=true, lateMinutes=15, flexMinutesOwed=30.");
    } else {
      console.error("  ✗ Record 3 failed late metrics verification:", rec3);
      passedAll = false;
    }

    // 2d. Half Day punch: Jane Doe on 2026-11-21 (09:00 - 14:00)
    const rec4 = savedAttendance.find(
      (a) => a.userId.toString() === user1Id.toString() && a.punchOut?.getHours() === 14
    );
    if (rec4 && rec4.status === "HALF_DAY" && rec4.totalWorkingMinutes === 240) {
      console.log("  ✓ Record 4 (Half Day, 09:00 - 14:00): status=HALF_DAY, totalWorkingMinutes=240 (5h gross - 1h lunch = 4h).");
    } else {
      console.error("  ✗ Record 4 failed half-day metrics verification:", rec4);
      passedAll = false;
    }

    // 2e. Missed Punch-Out: Alex Smith on 2026-11-21 (09:00 - empty)
    const rec5 = savedAttendance.find(
      (a) => a.userId.toString() === user2Id.toString() && a.punchOut === null
    );
    if (rec5 && rec5.status === "ABSENT" && rec5.punchOut === null && rec5.totalWorkingMinutes === 0) {
      console.log("  ✓ Record 5 (Missed Punch-Out, 09:00 - empty): status=ABSENT, punchOut=null, totalWorkingMinutes=0.");
    } else {
      console.error("  ✗ Record 5 failed missed punch-out verification:", rec5);
      passedAll = false;
    }
  } catch (err: any) {
    console.error("  ✗ Unexpected import error:", err);
    passedAll = false;
  }

  // -------------------------------------------------------------
  // TEST 3: Invalid Header Rejection
  // -------------------------------------------------------------
  console.log("\n[TEST 3] Testing Invalid CSV Header Rejection...");
  try {
    await importService.importCSV(
      Buffer.from("Wrong,Header,Names\n1,2,3", "utf-8"),
      "invalid.csv",
      adminId.toString()
    );
    console.error("  ✗ Failed: Rejected invalid headers check.");
    passedAll = false;
  } catch (err: any) {
    if (err.message.includes("Invalid CSV headers")) {
      console.log("  ✓ Correctly rejected invalid CSV headers with 400 Bad Request: " + err.message);
    } else {
      console.error("  ✗ Threw unexpected error:", err.message);
      passedAll = false;
    }
  }

  console.log("\n=================================================");
  if (passedAll) {
    console.log("ALL MODULE 4 BIOMETRIC IMPORT TESTS PASSED WITH 100% SUCCESS!");
  } else {
    console.log("SOME TESTS FAILED! CHECK LOGS ABOVE.");
  }
  console.log("=================================================");
}

runBiometricImportTest().catch(console.error);
