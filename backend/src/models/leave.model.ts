import { Schema, model, Document, Types } from "mongoose";

export type LeaveType = "FULL_DAY" | "HALF_DAY";
export const LEAVE_TYPES: LeaveType[] = ["FULL_DAY", "HALF_DAY"];

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
export const LEAVE_STATUSES: LeaveStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
];

export interface ILeave {
  userId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  leaveType: LeaveType;
  numberOfDays: number;
  reason: string;
  status: LeaveStatus;
  isPaid: boolean;
  paidDaysCount: number;
  lossOfPayDaysCount: number;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILeaveDocument extends ILeave, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeaveDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    leaveType: {
      type: String,
      enum: LEAVE_TYPES,
      default: "FULL_DAY",
      required: true,
    },
    numberOfDays: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: LEAVE_STATUSES,
      default: "PENDING",
      required: true,
      index: true,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    paidDaysCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lossOfPayDaysCount: {
      type: Number,
      default: 0,
      min: 0,
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
  },
  {
    timestamps: true,
    collection: "leaves",
  }
);

export const LeaveModel = model<ILeaveDocument>("Leave", leaveSchema);
