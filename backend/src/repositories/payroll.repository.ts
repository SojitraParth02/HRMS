import { Types } from "mongoose";
import {
  PayrollModel,
  IPayroll,
  IPayrollDocument,
  PayrollStatus,
  PaymentMethod,
} from "../models/payroll.model";

export class PayrollRepository {
  public async upsertDraftPayroll(
    userId: string,
    monthYear: string,
    data: Partial<IPayroll>
  ): Promise<IPayrollDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const updated = await PayrollModel.findOneAndUpdate(
      { userId: userObjectId, monthYear },
      { $set: data },
      { upsert: true, returnDocument: "after", runValidators: true }
    ).exec();

    return updated!;
  }

  public async findByUserAndMonth(
    userId: string,
    monthYear: string
  ): Promise<IPayrollDocument | null> {
    const userObjectId = new Types.ObjectId(userId);
    return await PayrollModel.findOne({
      userId: userObjectId,
      monthYear,
    }).exec();
  }

  public async findPayrollById(
    id: string
  ): Promise<IPayrollDocument | null> {
    return (await PayrollModel.findById(id)
      .populate("userId", "username email department designation phone monthlySalary")
      .populate("generatedBy", "username email")
      .populate("finalizedBy", "username email")
      .populate("paidBy", "username email")
      .exec()) as IPayrollDocument | null;
  }

  public async findPayrollByMonth(
    monthYear: string,
    status?: PayrollStatus
  ): Promise<IPayrollDocument[]> {
    const query: Record<string, unknown> = { monthYear };
    if (status) {
      query.status = status;
    }

    return (await PayrollModel.find(query)
      .populate("userId", "username email department designation phone monthlySalary")
      .populate("generatedBy", "username email")
      .populate("finalizedBy", "username email")
      .populate("paidBy", "username email")
      .sort({ "userId.username": 1, createdAt: 1 })
      .exec()) as IPayrollDocument[];
  }

  public async updatePayrollAdjustment(
    id: string,
    bonus: number,
    otherDeductions: number,
    netSalary: number,
    notes?: string
  ): Promise<IPayrollDocument | null> {
    const updatePayload: Record<string, unknown> = {
      bonus,
      otherDeductions,
      netSalary,
    };
    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    return (await PayrollModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { returnDocument: "after", runValidators: true }
    )
      .populate("userId", "username email department designation phone monthlySalary")
      .exec()) as IPayrollDocument | null;
  }

  public async finalizePayrollMonth(
    monthYear: string,
    finalizedBy: Types.ObjectId,
    finalizedAt: Date
  ): Promise<number> {
    const result = await PayrollModel.updateMany(
      { monthYear, status: "DRAFT" },
      {
        $set: {
          status: "FINALIZED",
          finalizedBy,
          finalizedAt,
        },
      }
    ).exec();

    return result.modifiedCount;
  }

  public async deleteDraftsForUsers(
    userIds: Types.ObjectId[],
    monthYear: string
  ): Promise<number> {
    if (userIds.length === 0) return 0;
    const result = await PayrollModel.deleteMany({
      userId: { $in: userIds },
      monthYear,
      status: "DRAFT",
    }).exec();
    return result.deletedCount;
  }

  public async markRecordPaid(
    id: string,
    paidBy: Types.ObjectId,
    paidAt: Date,
    paymentMethod: PaymentMethod,
    transactionReference?: string
  ): Promise<IPayrollDocument | null> {
    const updatePayload: Record<string, unknown> = {
      isPaid: true,
      paidAt,
      paymentMethod,
      paidBy,
    };
    if (transactionReference !== undefined) {
      updatePayload.transactionReference = transactionReference;
    }

    return (await PayrollModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { returnDocument: "after", runValidators: true }
    )
      .populate("userId", "username email department designation phone monthlySalary")
      .populate("generatedBy", "username email")
      .populate("finalizedBy", "username email")
      .populate("paidBy", "username email")
      .exec()) as IPayrollDocument | null;
  }

  public async markMonthPaid(
    monthYear: string,
    paidBy: Types.ObjectId,
    paidAt: Date,
    paymentMethod: PaymentMethod,
    transactionReference?: string
  ): Promise<number> {
    const updatePayload: Record<string, unknown> = {
      isPaid: true,
      paidAt,
      paymentMethod,
      paidBy,
    };
    if (transactionReference !== undefined) {
      updatePayload.transactionReference = transactionReference;
    }

    const result = await PayrollModel.updateMany(
      { monthYear, status: "FINALIZED", isPaid: false },
      { $set: updatePayload }
    ).exec();

    return result.modifiedCount;
  }

  public async findUserPayslips(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ records: IPayrollDocument[]; total: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const query: Record<string, unknown> = {
      userId: userObjectId,
      status: "FINALIZED",
    };

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      PayrollModel.find(query)
        .populate("userId", "username email department designation phone")
        .sort({ monthYear: -1, finalizedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec() as Promise<IPayrollDocument[]>,
      PayrollModel.countDocuments(query).exec(),
    ]);

    return { records, total };
  }
}

export const payrollRepository = new PayrollRepository();
