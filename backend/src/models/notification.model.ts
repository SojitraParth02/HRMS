import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "LEAVE_APPLIED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "CORRECTION_REQUESTED"
  | "CORRECTION_APPROVED"
  | "CORRECTION_REJECTED"
  | "OVERTIME_REQUESTED"
  | "OVERTIME_APPROVED"
  | "OVERTIME_REJECTED"
  | "ADVANCE_LOGGED"
  | "PAYROLL_FINALIZED";

export const NOTIFICATION_TYPES: NotificationType[] = [
  "LEAVE_APPLIED",
  "LEAVE_APPROVED",
  "LEAVE_REJECTED",
  "CORRECTION_REQUESTED",
  "CORRECTION_APPROVED",
  "CORRECTION_REJECTED",
  "OVERTIME_REQUESTED",
  "OVERTIME_APPROVED",
  "OVERTIME_REJECTED",
  "ADVANCE_LOGGED",
  "PAYROLL_FINALIZED",
];

export interface INotification {
  recipientId?: Types.ObjectId | null;
  targetRole?: "HR" | "ADMIN" | null;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotificationDocument extends INotification, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    targetRole: {
      type: String,
      enum: ["HR", "ADMIN", null],
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      required: true,
      trim: true,
      default: "/dashboard",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

// Compound index for querying unread notifications by user or role quickly
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ targetRole: 1, isRead: 1, createdAt: -1 });

export const NotificationModel = model<INotificationDocument>(
  "Notification",
  notificationSchema
);
