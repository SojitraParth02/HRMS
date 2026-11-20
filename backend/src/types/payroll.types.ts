import { z } from "zod";
import { PayrollStatus } from "../models/payroll.model";

const monthYearRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const runPayrollSchema = z.object({
  monthYear: z
    .string()
    .regex(monthYearRegex, "Month-Year must be in YYYY-MM format (e.g. 2026-11)"),
});

export const adjustPayrollSchema = z.object({
  bonus: z.number().min(0, "Bonus cannot be negative").optional(),
  otherDeductions: z
    .number()
    .min(0, "Other deductions cannot be negative")
    .optional(),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const finalizePayrollSchema = z.object({
  monthYear: z
    .string()
    .regex(monthYearRegex, "Month-Year must be in YYYY-MM format (e.g. 2026-11)"),
});

export type RunPayrollInput = z.infer<typeof runPayrollSchema>;
export type AdjustPayrollInput = z.infer<typeof adjustPayrollSchema>;
export type FinalizePayrollInput = z.infer<typeof finalizePayrollSchema>;

export interface PayrollQueryFilters {
  monthYear?: string;
  status?: PayrollStatus;
}
