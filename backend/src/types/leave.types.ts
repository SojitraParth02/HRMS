import { z } from "zod";
import { LeaveType, LeaveStatus, LEAVE_TYPES, LEAVE_STATUSES } from "../models/leave.model";

export type { LeaveType, LeaveStatus };
export { LEAVE_TYPES, LEAVE_STATUSES };

export const applyLeaveSchema = z
  .object({
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Valid ISO date required for startDate",
    }),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Valid ISO date required for endDate",
    }),
    leaveType: z.enum(["FULL_DAY", "HALF_DAY"], {
      message: "leaveType must be either FULL_DAY or HALF_DAY",
    }),
    reason: z
      .string()
      .min(5, "Reason must be at least 5 characters long")
      .max(500, "Reason cannot exceed 500 characters"),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return start <= end;
    },
    {
      message: "endDate cannot be before startDate",
      path: ["endDate"],
    }
  );

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;

export const reviewLeaveSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    message: "status must be either APPROVED or REJECTED",
  }),
  rejectionReason: z.string().max(500).optional(),
});

export type ReviewLeaveInput = z.infer<typeof reviewLeaveSchema>;

export interface LeaveBalanceSummary {
  yearlyPaidLeaveQuota: number;
  usedPaidDays: number;
  remainingPaidDays: number;
  totalLossOfPayDays: number;
}
