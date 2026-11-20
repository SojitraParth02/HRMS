import { Schema, model, Document, Types } from "mongoose";

export interface ICompanySettings {
  shiftStartTime: string;
  shiftEndTime: string;
  graceWindowEndTime: string;
  standardWorkHoursPerDay: number;
  lunchStartTime: string;
  lunchEndTime: string;
  yearlyPaidLeaveQuota: number;
  updatedBy?: Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICompanySettingsDocument extends ICompanySettings, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const companySettingsSchema = new Schema<ICompanySettingsDocument>(
  {
    shiftStartTime: {
      type: String,
      required: true,
      default: "09:00",
      trim: true,
    },
    shiftEndTime: {
      type: String,
      required: true,
      default: "18:00",
      trim: true,
    },
    graceWindowEndTime: {
      type: String,
      required: true,
      default: "09:30",
      trim: true,
    },
    standardWorkHoursPerDay: {
      type: Number,
      required: true,
      default: 8,
      min: 1,
      max: 24,
    },
    lunchStartTime: {
      type: String,
      required: true,
      default: "12:00",
      trim: true,
    },
    lunchEndTime: {
      type: String,
      required: true,
      default: "13:00",
      trim: true,
    },
    yearlyPaidLeaveQuota: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "company_settings",
  }
);

export const CompanySettingsModel = model<ICompanySettingsDocument>(
  "CompanySettings",
  companySettingsSchema
);
