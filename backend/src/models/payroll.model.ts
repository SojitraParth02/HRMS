import { Schema, model, Document, Types } from "mongoose";

export type PayrollStatus = "DRAFT" | "FINALIZED";
export const PAYROLL_STATUSES: PayrollStatus[] = ["DRAFT", "FINALIZED"];

export type PaymentMethod = "BANK_TRANSFER" | "UPI" | "CHEQUE" | "CASH";
export const PAYMENT_METHODS: PaymentMethod[] = [
  "BANK_TRANSFER",
  "UPI",
  "CHEQUE",
  "CASH",
];

export interface IPayroll {
  userId: Types.ObjectId;
  monthYear: string;
  status: PayrollStatus;

  // Frozen Financial Snapshot Fields
  baseSalary: number;
  perDayRate: number;
  hourlyRate: number;
  workingDaysStandard: number;
  lopDaysCount: number;
  lopDeduction: number;
  overtimeHours: number;
  overtimeHourlyRate: number;
  overtimePay: number;
  advanceDeduction: number;
  bonus: number;
  otherDeductions: number;
  netSalary: number;

  // Disbursement Tracking Fields
  isPaid: boolean;
  paidAt?: Date | null;
  paymentMethod?: PaymentMethod | null;
  transactionReference?: string | null;
  paidBy?: Types.ObjectId | null;

  // Audit Fields
  generatedBy: Types.ObjectId;
  finalizedBy?: Types.ObjectId | null;
  finalizedAt?: Date | null;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPayrollDocument extends IPayroll, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const payrollSchema = new Schema<IPayrollDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    monthYear: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: PAYROLL_STATUSES,
      default: "DRAFT",
      required: true,
    },

    // Frozen Financial Snapshot Fields
    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    perDayRate: {
      type: Number,
      required: true,
      min: 0,
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    workingDaysStandard: {
      type: Number,
      default: 26,
      required: true,
    },
    lopDaysCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lopDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimeHourlyRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimePay: {
      type: Number,
      default: 0,
      min: 0,
    },
    advanceDeduction: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonus: {
      type: Number,
      default: 0,
      min: 0,
    },
    otherDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    netSalary: {
      type: Number,
      required: true,
    },

    // Disbursement Tracking Fields
    isPaid: {
      type: Boolean,
      default: false,
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: null,
    },
    transactionReference: {
      type: String,
      trim: true,
      default: null,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Audit Fields
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    finalizedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    finalizedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "payrolls",
  }
);

// Compound unique index prevents duplicate payroll runs for the same user in a single billing month
payrollSchema.index({ userId: 1, monthYear: 1 }, { unique: true });

export const PayrollModel = model<IPayrollDocument>("Payroll", payrollSchema);
