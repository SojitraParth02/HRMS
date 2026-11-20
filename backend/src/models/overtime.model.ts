import { Schema, model, Document, Types } from "mongoose";

export type OvertimeStatus = "PENDING" | "APPROVED" | "REJECTED";
export const OVERTIME_STATUSES: OvertimeStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
];

export interface IOvertimeRequest {
  userId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  hours: number;
  taskDescription: string;
  status: OvertimeStatus;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  payrollCycle?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOvertimeRequestDocument extends IOvertimeRequest, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const overtimeRequestSchema = new Schema<IOvertimeRequestDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    hours: {
      type: Number,
      required: true,
      min: 0.1,
    },
    taskDescription: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: OVERTIME_STATUSES,
      default: "PENDING",
      required: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
      trim: true,
    },
    payrollCycle: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "overtime_requests",
  }
);

// Compound index for employee history & payroll cycle queries
overtimeRequestSchema.index({ userId: 1, date: 1, status: 1 });

export const OvertimeRequestModel = model<IOvertimeRequestDocument>(
  "OvertimeRequest",
  overtimeRequestSchema
);
