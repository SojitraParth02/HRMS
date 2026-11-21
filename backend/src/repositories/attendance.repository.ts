import { Types } from "mongoose";
import {
  AttendanceModel,
  IAttendance,
  IAttendanceDocument,
} from "../models/attendance.model";

export class AttendanceRepository {
  public async findByUserAndDate(
    userId: string,
    date: Date
  ): Promise<IAttendanceDocument | null> {
    const userObjectId = new Types.ObjectId(userId);
    return await AttendanceModel.findOne({
      userId: userObjectId,
      date,
    }).exec();
  }

  public async findById(id: string): Promise<IAttendanceDocument | null> {
    return await AttendanceModel.findById(id).exec();
  }

  public async createAttendance(
    data: Partial<IAttendance>
  ): Promise<IAttendanceDocument> {
    return await AttendanceModel.create(data);
  }

  public async updateAttendance(
    id: string,
    data: Partial<IAttendance>
  ): Promise<IAttendanceDocument | null> {
    return await AttendanceModel.findByIdAndUpdate(
      id,
      { $set: data },
      { returnDocument: "after", runValidators: true }
    ).exec();
  }

  public async findHistoryByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ records: IAttendanceDocument[]; total: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const query: Record<string, unknown> = { userId: userObjectId };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      AttendanceModel.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      AttendanceModel.countDocuments(query).exec(),
    ]);

    return { records, total };
  }

  public async findAllRoster(
    date: Date,
    userIds?: string[],
    page?: number,
    limit?: number
  ): Promise<{ roster: IAttendanceDocument[]; total: number }> {
    const query: Record<string, unknown> = { date };

    if (userIds !== undefined) {
      query.userId = { $in: userIds.map((id) => new Types.ObjectId(id)) };
    }

    const total = await AttendanceModel.countDocuments(query).exec();

    let queryBuilder = AttendanceModel.find(query)
      .populate("userId", "username email department designation role")
      .sort({ punchIn: 1 });

    if (page && limit) {
      const skip = (page - 1) * limit;
      queryBuilder = queryBuilder.skip(skip).limit(limit);
    }

    const roster = await queryBuilder.exec();
    return { roster, total };
  }
}

export const attendanceRepository = new AttendanceRepository();
