import { Types } from "mongoose";
import {
  OvertimeRequestModel,
  IOvertimeRequest,
  IOvertimeRequestDocument,
  OvertimeStatus,
} from "../models/overtime.model";

export class OvertimeRepository {
  public async createOvertimeRequest(
    data: Partial<IOvertimeRequest>
  ): Promise<IOvertimeRequestDocument> {
    return await OvertimeRequestModel.create(data);
  }

  public async findOvertimeById(
    id: string
  ): Promise<IOvertimeRequestDocument | null> {
    return await OvertimeRequestModel.findById(id).exec();
  }

  public async findMyOvertime(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ records: IOvertimeRequestDocument[]; total: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      OvertimeRequestModel.find({ userId: userObjectId })
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      OvertimeRequestModel.countDocuments({ userId: userObjectId }).exec(),
    ]);

    return { records, total };
  }

  public async findAllOvertime(
    filters: {
      status?: OvertimeStatus;
      startDate?: Date;
      endDate?: Date;
      userId?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{ records: IOvertimeRequestDocument[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.userId) {
      query.userId = new Types.ObjectId(filters.userId);
    }
    if (filters.startDate && filters.endDate) {
      query.date = { $gte: filters.startDate, $lte: filters.endDate };
    } else if (filters.startDate) {
      query.date = { $gte: filters.startDate };
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      OvertimeRequestModel.find(query)
        .populate("userId", "username email department designation")
        .populate("reviewedBy", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      OvertimeRequestModel.countDocuments(query).exec(),
    ]);

    return { records, total };
  }

  public async updateOvertimeReview(
    id: string,
    status: OvertimeStatus,
    reviewedBy: Types.ObjectId,
    reviewedAt: Date,
    rejectionReason?: string | null
  ): Promise<IOvertimeRequestDocument | null> {
    return await OvertimeRequestModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          reviewedBy,
          reviewedAt,
          rejectionReason: rejectionReason ?? null,
        },
      },
      { returnDocument: "after", runValidators: true }
    ).exec();
  }

  public async findApprovedOvertimeByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IOvertimeRequestDocument[]> {
    const userObjectId = new Types.ObjectId(userId);
    return await OvertimeRequestModel.find({
      userId: userObjectId,
      status: "APPROVED",
      date: { $gte: startDate, $lte: endDate },
    }).exec();
  }
}

export const overtimeRepository = new OvertimeRepository();
