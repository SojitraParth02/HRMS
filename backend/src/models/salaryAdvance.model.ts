import { Schema, model, Document, Types } from "mongoose";

export interface ISalaryAdvance {
  userId: Types.ObjectId;
  date: Date;
  amount: number;
  reason: string;
  givenBy: Types.ObjectId;
  monthYear: string;
  isDeducted: boolean;
  payrollId?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISalaryAdvanceDocument extends ISalaryAdvance, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const salaryAdvanceSchema = new Schema<ISalaryAdvanceDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    givenBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    monthYear: {
      type: String,
      required: true,
      trim: true,
    },
    isDeducted: {
      type: Boolean,
      default: false,
    },
    payrollId: {
      type: Schema.Types.ObjectId,
      ref: "Payroll",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "salary_advances",
  }
);

// Compound index for monthly payroll deductions aggregation
salaryAdvanceSchema.index({ userId: 1, monthYear: 1, isDeducted: 1 });

export const SalaryAdvanceModel = model<ISalaryAdvanceDocument>(
  "SalaryAdvance",
  salaryAdvanceSchema
);
