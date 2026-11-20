import { Schema, model, Document, Types } from "mongoose";

export type AttendanceStatus = "PRESENT" | "HALF_DAY" | "ABSENT" | "ON_LEAVE";
export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "PRESENT",
  "HALF_DAY",
  "ABSENT",
  "ON_LEAVE",
];

export interface IAttendance {
  userId: Types.ObjectId;
  date: Date;
  punchIn: Date | null;
  punchOut: Date | null;
  status: AttendanceStatus;
  isLate: boolean;
  lateMinutes: number;
  flexMinutesOwed: number;
  expectedPunchOut: Date | null;
  isCompensated: boolean;
  earlyLeavingMinutes?: number;
  totalWorkingMinutes: number;
  isCorrected: boolean;
  correctionRequestId?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAttendanceDocument extends IAttendance, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendanceDocument>(
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
    punchIn: {
      type: Date,
      default: null,
    },
    punchOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      default: "PRESENT",
      required: true,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    lateMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    flexMinutesOwed: {
      type: Number,
      default: 0,
      min: 0,
    },
    expectedPunchOut: {
      type: Date,
      default: null,
    },
    isCompensated: {
      type: Boolean,
      default: false,
    },
    earlyLeavingMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWorkingMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    isCorrected: {
      type: Boolean,
      default: false,
    },
    correctionRequestId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceCorrection",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "attendances",
  }
);

// Prevent duplicate attendance records for the same employee on the same calendar day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const AttendanceModel = model<IAttendanceDocument>(
  "Attendance",
  attendanceSchema
);
