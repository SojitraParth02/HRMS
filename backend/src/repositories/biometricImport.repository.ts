import { Types } from "mongoose";
import {
  BiometricImportModel,
  IBiometricImport,
  IBiometricImportDocument,
} from "../models/biometricImport.model";

export class BiometricImportRepository {
  public async createImportLog(
    data: {
      fileName: string;
      uploadedBy: Types.ObjectId;
      totalRows: number;
      successfulRows: number;
      failedRows: number;
      errorLog: Array<{ row: number; email?: string; reason: string }>;
      uploadedAt: Date;
    }
  ): Promise<IBiometricImportDocument> {
    const doc = new BiometricImportModel(data);
    return await doc.save();
  }

  public async getImportHistory(
    limit: number = 20
  ): Promise<IBiometricImportDocument[]> {
    return (await BiometricImportModel.find()
      .sort({ uploadedAt: -1 })
      .limit(limit)
      .populate("uploadedBy", "username email role")
      .exec()) as IBiometricImportDocument[];
  }
}

export const biometricImportRepository = new BiometricImportRepository();
