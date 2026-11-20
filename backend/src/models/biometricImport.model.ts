import { Schema, model, Document, Types } from "mongoose";

export interface IBiometricImportError {
  row: number;
  email?: string;
  reason: string;
}

export interface IBiometricImport {
  fileName: string;
  uploadedBy: Types.ObjectId;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errorLog: IBiometricImportError[];
  uploadedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IBiometricImportDocument extends IBiometricImport, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const biometricImportErrorSchema = new Schema<IBiometricImportError>(
  {
    row: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const biometricImportSchema = new Schema<IBiometricImportDocument>(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    totalRows: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    successfulRows: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    failedRows: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    errorLog: {
      type: [biometricImportErrorSchema],
      default: [],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "biometric_imports",
  }
);

export const BiometricImportModel = model<IBiometricImportDocument>(
  "BiometricImport",
  biometricImportSchema
);
