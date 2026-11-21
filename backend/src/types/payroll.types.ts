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

export const markPaidSchema = z.object({
  paymentMethod: z
    .enum(["BANK_TRANSFER", "UPI", "CHEQUE", "CASH"])
    .default("BANK_TRANSFER"),
  transactionReference: z.string().trim().max(100).optional(),
});

export const markMonthPaidSchema = z.object({
  monthYear: z
    .string()
    .regex(monthYearRegex, "Month-Year must be in YYYY-MM format (e.g. 2026-11)"),
  paymentMethod: z
    .enum(["BANK_TRANSFER", "UPI", "CHEQUE", "CASH"])
    .default("BANK_TRANSFER"),
  transactionReference: z.string().trim().max(100).optional(),
});

export type RunPayrollInput = z.infer<typeof runPayrollSchema>;
export type AdjustPayrollInput = z.infer<typeof adjustPayrollSchema>;
export type FinalizePayrollInput = z.infer<typeof finalizePayrollSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;
export type MarkMonthPaidInput = z.infer<typeof markMonthPaidSchema>;

export interface PayrollQueryFilters {
  monthYear?: string;
  status?: PayrollStatus;
  isPaid?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}
