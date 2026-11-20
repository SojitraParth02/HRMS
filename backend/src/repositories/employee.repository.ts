import { UserModel, IUserDocument, IUser } from "../models/user.model";
import { EmployeeStatus } from "../types/employee.types";

export class EmployeeRepository {
  /**
   * Persists a new employee or user record in the database.
   */
  public async createEmployee(data: Partial<IUser>): Promise<IUserDocument> {
    return UserModel.create(data);
  }

  /**
   * Looks up a user record by their unique email address.
   */
  public async findEmployeeByEmail(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email }).exec();
  }

  /**
   * Looks up a user record by their BSON identifier with password excluded.
   */
  public async findEmployeeById(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id).select("-password").exec();
  }

  /**
   * Retrieves all users/employees with password excluded, sorted by newest first.
   */
  public async getAllEmployees(): Promise<IUserDocument[]> {
    return UserModel.find({}).select("-password").sort({ createdAt: -1 }).exec();
  }

  /**
   * Updates an existing employee's details (username, phone, department, designation, salary, role, joiningDate).
   */
  public async updateEmployee(
    id: string,
    data: Partial<IUser>
  ): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(
      id,
      { $set: data },
      { returnDocument: "after", runValidators: true }
    )
      .select("-password")
      .exec();
  }

  /**
   * Updates an employee's lifecycle status, deactivation timestamp, and session ID.
   */
  public async updateEmployeeStatus(
    id: string,
    status: EmployeeStatus,
    deactivatedAt: Date | null,
    sessionId: string | null
  ): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          deactivatedAt,
          sessionId,
        },
      },
      { returnDocument: "after", runValidators: true }
    )
      .select("-password")
      .exec();
  }

  /**
   * Permanently hard-deletes inactive accounts whose deactivation timestamp is on or before cutoffDate.
   */
  public async deleteExpiredInactiveEmployees(cutoffDate: Date): Promise<number> {
    const result = await UserModel.deleteMany({
      status: "INACTIVE",
      deactivatedAt: {
        $ne: null,
        $lte: cutoffDate,
      },
    }).exec();

    return result.deletedCount ?? 0;
  }
}

export const employeeRepository = new EmployeeRepository();
