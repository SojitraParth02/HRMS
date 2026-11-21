import { Types } from "mongoose";
import { UserModel } from "../models/user.model";
import {
  LeaveModel,
  ILeave,
  ILeaveDocument,
  LeaveStatus,
} from "../models/leave.model";

export class LeaveRepository {
  public async createLeave(data: Partial<ILeave>): Promise<ILeaveDocument> {
    return await LeaveModel.create(data);
  }

  public async findById(id: string): Promise<ILeaveDocument | null> {
    return await LeaveModel.findById(id).exec();
  }

  public async findApprovedLeavesInYear(
    userId: string,
    year: number
  ): Promise<ILeaveDocument[]> {
    const userObjectId = new Types.ObjectId(userId);
    const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    return await LeaveModel.find({
      userId: userObjectId,
      status: "APPROVED",
      startDate: { $gte: startOfYear, $lte: endOfYear },
    }).exec();
  }

  public async findApprovedLeavesInDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ILeaveDocument[]> {
    const userObjectId = new Types.ObjectId(userId);
    return await LeaveModel.find({
      userId: userObjectId,
      status: "APPROVED",
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    }).exec();
  }

  public async hasOverlappingLeave(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const userObjectId = new Types.ObjectId(userId);
    const count = await LeaveModel.countDocuments({
      userId: userObjectId,
      status: { $in: ["PENDING", "APPROVED"] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    }).exec();

    return count > 0;
  }

  public async findMyLeaves(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ records: ILeaveDocument[]; total: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      LeaveModel.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("reviewedBy", "username email")
        .exec(),
      LeaveModel.countDocuments({ userId: userObjectId }).exec(),
    ]);

    return { records, total };
  }

  public async findAllLeaves(
    status?: LeaveStatus,
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<{ records: ILeaveDocument[]; total: number }> {
    const query: Record<string, unknown> = status ? { status } : {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      const matchingUsers = await UserModel.find(
        {
          $or: [
            { username: regex },
            { email: regex },
            { department: regex },
            { designation: regex },
          ],
        },
        "_id"
      ).exec();
      const userIds = matchingUsers.map((u) => u._id);
      query.userId = { $in: userIds };
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      LeaveModel.find(query)
        .populate("userId", "username email department designation role")
        .populate("reviewedBy", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      LeaveModel.countDocuments(query).exec(),
    ]);

    return { records, total };
  }

  public async updateStatus(
    id: string,
    status: LeaveStatus,
    reviewedBy: string,
    reviewedAt: Date,
    rejectionReason?: string | null
  ): Promise<ILeaveDocument | null> {
    const reviewerObjectId = new Types.ObjectId(reviewedBy);
    return await LeaveModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          reviewedBy: reviewerObjectId,
          reviewedAt,
          rejectionReason: rejectionReason ?? null,
        },
      },
      { returnDocument: "after", runValidators: true }
    ).exec();
  }
}

export const leaveRepository = new LeaveRepository();
