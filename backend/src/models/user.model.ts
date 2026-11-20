import { Schema, model, Document, Model, Types } from "mongoose";
import { UserRole, EmployeeStatus, USER_ROLES, EMPLOYEE_STATUSES } from "../types/employee.types";

export interface IUser {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  department: string;
  designation: string;
  monthlySalary: number;
  status: EmployeeStatus;
  createdBy: Types.ObjectId | null;
  sessionId: string | null;
  joiningDate?: Date;
  deactivatedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Admin aliases for backwards compatibility and domain clarity
export type IAdmin = IUser;
export type IAdminDocument = IUserDocument;

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "EMPLOYEE",
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    department: {
      type: String,
      default: "Administration",
      trim: true,
    },
    designation: {
      type: String,
      default: "Employee",
      trim: true,
    },
    monthlySalary: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: EMPLOYEE_STATUSES,
      default: "ACTIVE",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sessionId: {
      type: String,
      default: null,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    deactivatedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ status: 1, deactivatedAt: 1 });

export const UserModel: Model<IUserDocument> = model<IUserDocument>("User", userSchema);
export const AdminModel: Model<IUserDocument> = UserModel;
