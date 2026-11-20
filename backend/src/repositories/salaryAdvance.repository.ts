import { Types } from "mongoose";
import {
  SalaryAdvanceModel,
  ISalaryAdvance,
  ISalaryAdvanceDocument,
} from "../models/salaryAdvance.model";

export class SalaryAdvanceRepository {
  public async createSalaryAdvance(
    data: Partial<ISalaryAdvance>
  ): Promise<ISalaryAdvanceDocument> {
    return await SalaryAdvanceModel.create(data);
  }

  public async findAdvanceById(
    id: string
  ): Promise<ISalaryAdvanceDocument | null> {
    return await SalaryAdvanceModel.findById(id).exec();
  }

  public async findAdvancesByUser(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ records: ISalaryAdvanceDocument[]; total: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      SalaryAdvanceModel.find({ userId: userObjectId })
        .populate("givenBy", "username email")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      SalaryAdvanceModel.countDocuments({ userId: userObjectId }).exec(),
    ]);

    return { records, total };
  }

  public async findAllAdvances(
    filters: {
      monthYear?: string;
      isDeducted?: boolean;
      userId?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ records: ISalaryAdvanceDocument[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.monthYear) {
      query.monthYear = filters.monthYear;
    }
    if (typeof filters.isDeducted === "boolean") {
      query.isDeducted = filters.isDeducted;
    }
    if (filters.userId) {
      query.userId = new Types.ObjectId(filters.userId);
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      SalaryAdvanceModel.find(query)
        .populate("userId", "username email department designation monthlySalary")
        .populate("givenBy", "username email")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      SalaryAdvanceModel.countDocuments(query).exec(),
    ]);

    return { records, total };
  }

  public async findUndeductedAdvancesForUser(
    userId: string,
    monthYear: string
  ): Promise<ISalaryAdvanceDocument[]> {
    const userObjectId = new Types.ObjectId(userId);
    return await SalaryAdvanceModel.find({
      userId: userObjectId,
      monthYear,
      isDeducted: false,
    }).exec();
  }

  public async markAdvancesAsDeducted(
    advanceIds: string[],
    payrollId: Types.ObjectId
  ): Promise<number> {
    const objectIds = advanceIds.map((id) => new Types.ObjectId(id));
    const result = await SalaryAdvanceModel.updateMany(
      { _id: { $in: objectIds } },
      {
        $set: {
          isDeducted: true,
          payrollId,
        },
      }
    ).exec();

    return result.modifiedCount;
  }
}

export const salaryAdvanceRepository = new SalaryAdvanceRepository();
