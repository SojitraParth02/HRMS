import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const monthYearRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const createAdvanceSchema = z.object({
  userId: z.string().regex(objectIdRegex, "Invalid employee user ID"),
  amount: z.number().positive("Advance amount must be greater than 0"),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters"),
  monthYear: z
    .string()
    .regex(monthYearRegex, "Month-Year must be in YYYY-MM format (e.g. 2026-11)"),
  date: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid date format"),
});

export type CreateAdvanceInput = z.infer<typeof createAdvanceSchema>;

export interface AdvanceFilters {
  monthYear?: string;
  isDeducted?: boolean;
  userId?: string;
  page?: number;
  limit?: number;
}
