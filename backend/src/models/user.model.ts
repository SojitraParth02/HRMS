import { Schema, model, Document, Model } from "mongoose";

export interface IUser {
  username: string;
  email: string;
  password: string;
  role: "ADMIN";
  sessionId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

// Admin aliases for domain clarity
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
      enum: ["ADMIN"],
      default: "ADMIN",
    },
    sessionId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const UserModel: Model<IUserDocument> = model<IUserDocument>("User", userSchema);
export const AdminModel: Model<IUserDocument> = UserModel;
