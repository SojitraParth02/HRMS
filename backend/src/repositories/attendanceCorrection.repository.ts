import { Types } from "mongoose";
import {
  AttendanceCorrectionModel,
  IAttendanceCorrection,
  IAttendanceCorrectionDocument,
  CorrectionStatus,
} from "../models/attendanceCorrection.model";

export class AttendanceCorrectionRepository {
  public async createCorrection(
    data: Partial<IAttendanceCorrection>
  ): Promise<IAttendanceCorrectionDocument> {
    return await AttendanceCorrectionModel.create(data);
  }

  public async findById(
    id: string
  ): Promise<IAttendanceCorrectionDocument | null> {
    return await AttendanceCorrectionModel.findById(id).exec();
  }

  public async findPendingByAttendanceId(
    attendanceId: string
  ): Promise<IAttendanceCorrectionDocument | null> {
    const attendanceObjectId = new Types.ObjectId(attendanceId);
    return await AttendanceCorrectionModel.findOne({
      attendanceId: attendanceObjectId,
      status: "PENDING",
    }).exec();
  }

  public async findAllCorrections(
    status?: CorrectionStatus,
    page?: number,
    limit?: number
  ): Promise<{ corrections: IAttendanceCorrectionDocument[]; total: number }> {
    const query = status ? { status } : {};
    const total = await AttendanceCorrectionModel.countDocuments(query).exec();

    let queryBuilder = AttendanceCorrectionModel.find(query)
      .populate("userId", "username email department designation role")
      .populate("attendanceId")
      .sort({ createdAt: -1 });

    if (page && limit) {
      const skip = (page - 1) * limit;
      queryBuilder = queryBuilder.skip(skip).limit(limit);
    }

    const corrections = await queryBuilder.exec();
    return { corrections, total };
  }

  public async updateStatus(
    id: string,
    status: CorrectionStatus,
    reviewedBy: string,
    reviewedAt: Date,
    rejectionReason?: string | null
  ): Promise<IAttendanceCorrectionDocument | null> {
    const reviewerObjectId = new Types.ObjectId(reviewedBy);
    return await AttendanceCorrectionModel.findByIdAndUpdate(
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

export const attendanceCorrectionRepository =
  new AttendanceCorrectionRepository();
