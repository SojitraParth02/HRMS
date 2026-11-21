import { z } from "zod";
import { OvertimeStatus } from "../models/overtime.model";

const timeStringRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createOvertimeSchema = z.object({
  date: z
    .string()
    .min(1, "Date is required")
    .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
  startTime: z
    .string()
    .regex(timeStringRegex, "Start time must be in HH:mm format (24-hour)"),
  endTime: z
    .string()
    .regex(timeStringRegex, "End time must be in HH:mm format (24-hour)"),
  taskDescription: z
    .string()
    .trim()
    .min(5, "Task description must be at least 5 characters"),
});

export const reviewOvertimeSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"], {
    message: "Status must be either APPROVED or REJECTED",
  }),
  rejectionReason: z.string().trim().max(500).optional(),
});

export type CreateOvertimeInput = z.infer<typeof createOvertimeSchema>;
export type ReviewOvertimeInput = z.infer<typeof reviewOvertimeSchema>;

export interface OvertimeFilters {
  status?: OvertimeStatus;
  startDate?: string;
  endDate?: string;
  userId?: string;
  page?: number;
  limit?: number;
  search?: string;
}
