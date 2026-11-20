import { Schema, model, Document, Types } from "mongoose";

export type CorrectionStatus = "PENDING" | "APPROVED" | "REJECTED";
export const CORRECTION_STATUSES: CorrectionStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
];

export interface IAttendanceCorrection {
  attendanceId: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  originalPunchIn: Date;
  requestedPunchIn: Date;
  originalPunchOut?: Date | null;
  requestedPunchOut?: Date | null;
  reason: string;
  status: CorrectionStatus;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAttendanceCorrectionDocument
  extends IAttendanceCorrection,
    Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceCorrectionSchema = new Schema<IAttendanceCorrectionDocument>(
  {
    attendanceId: {
      type: Schema.Types.ObjectId,
      ref: "Attendance",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
    },
    originalPunchIn: {
      type: Date,
      required: true,
    },
    requestedPunchIn: {
      type: Date,
      required: true,
    },
    originalPunchOut: {
      type: Date,
      default: null,
    },
    requestedPunchOut: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: CORRECTION_STATUSES,
      default: "PENDING",
      required: true,
      index: true,
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
    collection: "attendance_corrections",
  }
);

export const AttendanceCorrectionModel = model<IAttendanceCorrectionDocument>(
  "AttendanceCorrection",
  attendanceCorrectionSchema
);
