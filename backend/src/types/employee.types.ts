import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

/**
 * Regular expression enforcing password security policy:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character (@$!%*?&#)
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

/**
 * Regular expression enforcing ITU-T E.164 international phone number format:
 * - Starts with a plus sign '+'
 * - Followed by 1 to 15 digits (country code + subscriber number)
 * Example: +919876543210, +14155552671
 */
export const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Supported User & Employee RBAC Roles:
 * - ADMIN: Unrestricted authority across all system features and user creation.
 * - HR: Restricted authority; can only create and manage standard EMPLOYEEs.
 * - EMPLOYEE: Standard user authority.
 */
export const USER_ROLES = ["ADMIN", "HR", "EMPLOYEE"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const EMPLOYEE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

/**
 * Zod validation schema for creating an employee.
 * Enforces strict typing, string trimming, regex checks, and range validations.
 */
export const createEmployeeSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username must be between 2 and 50 characters")
    .max(50, "Username must be between 2 and 50 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
  password: z
    .string()
    .regex(
      PASSWORD_REGEX,
      "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&#)"
    ),
  role: z.enum(["ADMIN", "HR", "EMPLOYEE"]),
  phone: z
    .string()
    .trim()
    .regex(
      E164_PHONE_REGEX,
      "Phone number must follow international E.164 format (e.g. +919876543210)"
    )
    .refine(
      (val) => {
        try {
          return isValidPhoneNumber(val);
        } catch {
          return false;
        }
      },
      {
        message: "Invalid mobile number for the selected country.",
      }
    ),
  department: z
    .string()
    .trim()
    .min(1, "Department is required"),
  designation: z
    .string()
    .trim()
    .min(1, "Designation is required"),
  monthlySalary: z
    .number()
    .positive("Monthly salary must be a positive number"),
  joiningDate: z
    .union([
      z.string().min(1, "Joining date is required"),
      z.date(),
    ])
    .refine(
      (val) => {
        const dateStr =
          typeof val === "string"
            ? val.split("T")[0]
            : val.toISOString().split("T")[0];
        const todayStr = new Date().toISOString().split("T")[0];
        return (dateStr ?? "") >= (todayStr ?? "");
      },
      {
        message: "Joining date cannot be in the past.",
      }
    ),
});

/**
 * Inferred TypeScript input type for creating an employee.
 * Guaranteed zero 'any' and zero 'unknown'.
 */
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

/**
 * Zod validation schema for updating an existing employee record.
 */
export const updateEmployeeSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username must be between 2 and 50 characters")
    .max(50, "Username must be between 2 and 50 characters")
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .optional(),
  password: z
    .string()
    .regex(
      PASSWORD_REGEX,
      "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&#)"
    )
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(
      E164_PHONE_REGEX,
      "Phone number must follow international E.164 format (e.g. +919876543210)"
    )
    .refine(
      (val) => {
        try {
          return isValidPhoneNumber(val);
        } catch {
          return false;
        }
      },
      {
        message: "Invalid mobile number for the selected country.",
      }
    )
    .optional(),
  department: z.string().trim().min(1, "Department is required").optional(),
  designation: z.string().trim().min(1, "Designation is required").optional(),
  monthlySalary: z.number().positive("Monthly salary must be a positive number").optional(),
  role: z.enum(["ADMIN", "HR", "EMPLOYEE"]).optional(),
  joiningDate: z
    .union([z.string().min(1, "Joining date is required"), z.date()])
    .optional(),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

/**
 * Domain entity interface representing an employee record.
 */
export interface IEmployee {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  role: UserRole;
  phone: string;
  department: string;
  designation: string;
  monthlySalary: number;
  status: EmployeeStatus;
  joiningDate: Date | string;
  createdBy: string | null;
  sessionId: string | null;
  deactivatedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type Employee = IEmployee;
