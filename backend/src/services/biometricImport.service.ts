import { Types } from "mongoose";
import {
  BiometricImportRepository,
  biometricImportRepository,
} from "../repositories/biometricImport.repository";
import { AttendanceModel } from "../models/attendance.model";
import { UserModel } from "../models/user.model";
import {
  SettingsRepository,
  settingsRepository,
} from "../repositories/settings.repository";
import { AttendanceService, attendanceService } from "./attendance.service";
import { BadRequestError } from "../utils/errors";
import { IBiometricImportDocument, IBiometricImportError } from "../models/biometricImport.model";

export interface IBiometricRowData {
  rowNumber: number;
  email: string;
  date: string;
  punchIn: string;
  punchOut?: string;
}

export interface IBiometricImportResult {
  importId: string;
  fileName: string;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errorLog: IBiometricImportError[];
  uploadedAt: Date;
}

export class BiometricImportService {
  constructor(
    private readonly importRepo: BiometricImportRepository = biometricImportRepository,
    private readonly settingsRepo: SettingsRepository = settingsRepository,
    private readonly attendanceSvc: AttendanceService = attendanceService
  ) {}

  public async importCSV(
    fileBuffer: Buffer,
    fileName: string,
    uploadedById: string
  ): Promise<IBiometricImportResult> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestError("Uploaded CSV file is empty.");
    }

    const content = fileBuffer.toString("utf-8");
    const rawLines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

    if (rawLines.length === 0) {
      throw new BadRequestError("Uploaded CSV file has no content.");
    }

    // 1. Validate Header
    const headerLine = rawLines[0];
    const headers = headerLine.split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const expectedHeaders = ["Email", "Date", "PunchIn", "PunchOut"];

    const isHeaderValid =
      headers.length >= 4 &&
      headers[0].toLowerCase() === "email" &&
      headers[1].toLowerCase() === "date" &&
      headers[2].toLowerCase() === "punchin" &&
      headers[3].toLowerCase() === "punchout";

    if (!isHeaderValid) {
      throw new BadRequestError(
        `Invalid CSV headers. Expected: ${expectedHeaders.join(",")}. Found: ${headers.join(",")}`
      );
    }

    const dataLines = rawLines.slice(1);
    if (dataLines.length === 0) {
      throw new BadRequestError("The CSV file contains only headers and no attendance records.");
    }

    // 2. Load Settings & Active Employees
    const settings = await this.settingsRepo.getSettings();
    const activeUsers = await UserModel.find({ status: "ACTIVE" }).select(
      "_id email username department designation"
    );

    const userMap = new Map<string, (typeof activeUsers)[0]>();
    for (const u of activeUsers) {
      userMap.set(u.email.toLowerCase().trim(), u);
    }

    const errorLog: IBiometricImportError[] = [];
    const seenDeduplicationKeys = new Set<string>();
    let successfulRows = 0;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

    // 3. Process Each Row
    for (let i = 0; i < dataLines.length; i++) {
      const rowNumber = i + 2; // Row 1 is header
      const line = dataLines[i];
      const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));

      const email = cols[0] || "";
      const dateStr = cols[1] || "";
      const punchInStr = cols[2] || "";
      const punchOutStr = cols[3] || "";

      // Validation 1: Email
      if (!email || !emailRegex.test(email)) {
        errorLog.push({
          row: rowNumber,
          email,
          reason: "Missing or invalid email address format.",
        });
        continue;
      }

      const lowerEmail = email.toLowerCase().trim();
      const user = userMap.get(lowerEmail);
      if (!user) {
        errorLog.push({
          row: rowNumber,
          email,
          reason: `Employee with email '${email}' not found in active staff roster.`,
        });
        continue;
      }

      // Validation 2: Date
      if (!dateStr || !dateRegex.test(dateStr)) {
        errorLog.push({
          row: rowNumber,
          email,
          reason: "Invalid Date format. Must be YYYY-MM-DD.",
        });
        continue;
      }

      const [year, month, day] = dateStr.split("-").map(Number);
      const parsedDateCheck = new Date(Date.UTC(year, month - 1, day));
      if (
        isNaN(parsedDateCheck.getTime()) ||
        parsedDateCheck.getUTCFullYear() !== year ||
        parsedDateCheck.getUTCMonth() !== month - 1 ||
        parsedDateCheck.getUTCDate() !== day
      ) {
        errorLog.push({
          row: rowNumber,
          email,
          reason: `Invalid calendar date '${dateStr}'.`,
        });
        continue;
      }

      // Validation 3: Deduplication in File
      const dedupKey = `${lowerEmail}_${dateStr}`;
      if (seenDeduplicationKeys.has(dedupKey)) {
        errorLog.push({
          row: rowNumber,
          email,
          reason: `Duplicate attendance entry for employee on ${dateStr} suppressed.`,
        });
        continue;
      }
      seenDeduplicationKeys.add(dedupKey);

      // Validation 4: PunchIn
      if (!punchInStr || !timeRegex.test(punchInStr)) {
        errorLog.push({
          row: rowNumber,
          email,
          reason: "Invalid or missing PunchIn time. Must be HH:mm.",
        });
        continue;
      }

      // Validation 5: PunchOut (Optional)
      if (punchOutStr && !timeRegex.test(punchOutStr)) {
        errorLog.push({
          row: rowNumber,
          email,
          reason: "Invalid PunchOut time format. Must be HH:mm (or empty).",
        });
        continue;
      }

      // 4. Time & Metrics Calculation
      const baseDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

      const [inHour, inMin] = punchInStr.split(":").map(Number);
      const punchInDate = new Date(year, month - 1, day, inHour, inMin, 0, 0);

      // Punch In Metrics (grace, flex, expected out)
      const inMetrics = this.attendanceSvc.calculatePunchInMetrics(
        punchInDate,
        settings
      );

      let punchOutDate: Date | null = null;
      let totalWorkingMinutes = 0;
      let status: "PRESENT" | "HALF_DAY" | "ABSENT" = "PRESENT";
      let isCompensated = false;
      let earlyLeavingMinutes = 0;

      if (punchOutStr) {
        const [outHour, outMin] = punchOutStr.split(":").map(Number);
        punchOutDate = new Date(year, month - 1, day, outHour, outMin, 0, 0);

        if (punchOutDate.getTime() < punchInDate.getTime()) {
          errorLog.push({
            row: rowNumber,
            email,
            reason: `PunchOut time (${punchOutStr}) cannot be earlier than PunchIn time (${punchInStr}).`,
          });
          continue;
        }

        const outMetrics = this.attendanceSvc.calculatePunchOutMetrics(
          punchInDate,
          punchOutDate,
          inMetrics.expectedPunchOut
        );

        totalWorkingMinutes = outMetrics.totalWorkingMinutes;
        status = outMetrics.status as "PRESENT" | "HALF_DAY" | "ABSENT";
        isCompensated = outMetrics.isCompensated;
        earlyLeavingMinutes = outMetrics.earlyLeavingMinutes;
      } else {
        // Missing punch-out
        punchOutDate = null;
        totalWorkingMinutes = 0;
        status = "ABSENT";
        isCompensated = false;
        earlyLeavingMinutes = 0;
      }

      // 5. Upsert to Attendance Collection
      await AttendanceModel.findOneAndUpdate(
        { userId: user._id, date: baseDate },
        {
          $set: {
            userId: user._id,
            date: baseDate,
            punchIn: punchInDate,
            punchOut: punchOutDate,
            status,
            isLate: inMetrics.isLate,
            lateMinutes: inMetrics.lateMinutes,
            flexMinutesOwed: inMetrics.flexMinutesOwed,
            expectedPunchOut: inMetrics.expectedPunchOut,
            isCompensated,
            earlyLeavingMinutes,
            totalWorkingMinutes,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );

      successfulRows++;
    }

    const failedRows = errorLog.length;
    const uploadedAt = new Date();

    // 6. Record in Biometric Import Audit Collection
    const savedLog = await this.importRepo.createImportLog({
      fileName,
      uploadedBy: new Types.ObjectId(uploadedById),
      totalRows: dataLines.length,
      successfulRows,
      failedRows,
      errorLog,
      uploadedAt,
    });

    return {
      importId: savedLog._id.toString(),
      fileName,
      totalRows: dataLines.length,
      successfulRows,
      failedRows,
      errorLog,
      uploadedAt,
    };
  }

  public async getImportHistory(limit: number = 20): Promise<IBiometricImportDocument[]> {
    return await this.importRepo.getImportHistory(limit);
  }
}

export const biometricImportService = new BiometricImportService();
