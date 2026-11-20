import { z } from "zod";
import { AttendanceStatus, ATTENDANCE_STATUSES } from "../models/attendance.model";
import { CorrectionStatus, CORRECTION_STATUSES } from "../models/attendanceCorrection.model";

export type { AttendanceStatus, CorrectionStatus };
export { ATTENDANCE_STATUSES, CORRECTION_STATUSES };

export const createCorrectionSchema = z.object({
  attendanceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Attendance ID format"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Valid ISO date required",
  }),
  requestedPunchIn: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Valid ISO timestamp required for requestedPunchIn",
  }),
  requestedPunchOut: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Valid ISO timestamp required for requestedPunchOut",
    })
    .optional(),
  reason: z
    .string()
    .min(5, "Reason must be at least 5 characters long")
    .max(500, "Reason cannot exceed 500 characters"),
});

export type CreateCorrectionInput = z.infer<typeof createCorrectionSchema>;

export const reviewCorrectionSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    message: "Status must be either APPROVED or REJECTED",
  }),
  rejectionReason: z.string().max(500).optional(),
});

export type ReviewCorrectionInput = z.infer<typeof reviewCorrectionSchema>;
