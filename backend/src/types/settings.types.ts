import { z } from "zod";

const timeStringRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const updateSettingsSchema = z.object({
  shiftStartTime: z
    .string()
    .regex(timeStringRegex, "Invalid shift start time format (HH:mm)")
    .optional(),
  shiftEndTime: z
    .string()
    .regex(timeStringRegex, "Invalid shift end time format (HH:mm)")
    .optional(),
  graceWindowEndTime: z
    .string()
    .regex(timeStringRegex, "Invalid grace window end time format (HH:mm)")
    .optional(),
  standardWorkHoursPerDay: z
    .number()
    .min(1, "Work hours must be at least 1")
    .max(24, "Work hours cannot exceed 24")
    .optional(),
  lunchStartTime: z
    .string()
    .regex(timeStringRegex, "Invalid lunch start time format (HH:mm)")
    .optional(),
  lunchEndTime: z
    .string()
    .regex(timeStringRegex, "Invalid lunch end time format (HH:mm)")
    .optional(),
  yearlyPaidLeaveQuota: z
    .number()
    .min(0, "Yearly paid leave quota cannot be negative")
    .max(365, "Yearly paid leave quota cannot exceed 365")
    .optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
