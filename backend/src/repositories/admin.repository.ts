import { AdminModel, IUserDocument } from "../models/user.model";

export class AdminRepository {
  public async findAdminByEmail(email: string): Promise<IUserDocument | null> {
    return AdminModel.findOne({ email }).exec();
  }

  public async findAdminById(id: string): Promise<IUserDocument | null> {
    return AdminModel.findById(id).exec();
  }

  public async updateAdminSession(id: string, sessionId: string): Promise<IUserDocument | null> {
    return AdminModel.findByIdAndUpdate(
      id,
      { sessionId },
      { returnDocument: "after" }
    ).exec();
  }
}

export const adminRepository = new AdminRepository();
