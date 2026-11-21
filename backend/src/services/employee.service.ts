import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { employeeRepository, EmployeeRepository } from "../repositories/employee.repository";
import { IUserDocument } from "../models/user.model";
import { CreateEmployeeInput, UpdateEmployeeInput, UserRole, IEmployee } from "../types/employee.types";
import { IUser } from "../models/user.model";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../utils/errors";

export class EmployeeService {
  private readonly repository: EmployeeRepository;
  private readonly saltRounds: number = 10;

  constructor(repository: EmployeeRepository = employeeRepository) {
    this.repository = repository;
  }

  /**
   * Registers a new employee or staff user after verifying uniqueness,
   * enforcing strict RBAC hierarchy rules, hashing password, and saving to repository.
   */
  public async createEmployeeService(
    input: CreateEmployeeInput,
    creatorId: string,
    creatorRole: UserRole
  ): Promise<IEmployee> {
    // 1. Email Uniqueness Check
    const existingEmployee: IUserDocument | null = await this.repository.findEmployeeByEmail(
      input.email
    );

    if (existingEmployee) {
      throw new ConflictError(`An employee with email "${input.email}" already exists.`);
    }

    // 2. Strict RBAC Enforcement: HR users are strictly forbidden from creating HR or Admin roles/designations
    if (creatorRole === "HR") {
      const isTargetRoleRestricted: boolean = input.role === "HR" || input.role === "ADMIN";
      const isDesignationRestricted: boolean = /^(hr|admin)/i.test(input.designation.trim());

      if (isTargetRoleRestricted || isDesignationRestricted) {
        throw new ForbiddenError("HR users cannot create HR or Admin accounts.");
      }
    }

    // 3. Secure Password Hashing
    const hashedPassword: string = await bcrypt.hash(input.password, this.saltRounds);

    // 4. Normalize joining date & creator reference
    const parsedJoiningDate: Date =
      typeof input.joiningDate === "string" ? new Date(input.joiningDate) : input.joiningDate;

    const createdByObjectId: Types.ObjectId | null = Types.ObjectId.isValid(creatorId)
      ? new Types.ObjectId(creatorId)
      : null;

    // 5. Persist via repository
    const savedEmployee: IUserDocument = await this.repository.createEmployee({
      username: input.username,
      email: input.email,
      password: hashedPassword,
      role: input.role,
      phone: input.phone,
      department: input.department,
      designation: input.designation,
      monthlySalary: input.monthlySalary,
      status: "ACTIVE",
      joiningDate: parsedJoiningDate,
      createdBy: createdByObjectId,
      sessionId: null,
    });

    return this.mapToSanitizedEmployee(savedEmployee);
  }

  /**
   * Retrieves all registered employees, sanitized of sensitive credentials.
   */
  public async getAllEmployeesService(): Promise<IEmployee[]> {
    const employees: IUserDocument[] = await this.repository.getAllEmployees();
    return employees.map((emp) => this.mapToSanitizedEmployee(emp));
  }

  /**
   * Retrieves paginated registered employees, sanitized of sensitive credentials.
   */
  public async getPaginatedEmployeesService(
    page: number = 1,
    limit: number = 10,
    search?: string,
    department?: string,
    role?: string
  ): Promise<{ employees: IEmployee[]; total: number }> {
    const { employees, total } = await this.repository.getPaginatedEmployees(
      page,
      limit,
      search,
      department,
      role
    );
    return {
      employees: employees.map((emp) => this.mapToSanitizedEmployee(emp)),
      total,
    };
  }

  /**
   * Deactivates (soft deletes) an employee account:
   * - Enforces self-preservation rule (Admin cannot deactivate themselves)
   * - Enforces HR ceiling barrier (HR cannot deactivate HR or Admin accounts)
   * - Sets status to INACTIVE, records deactivatedAt timestamp, and wipes sessionId
   */
  public async deactivateEmployeeService(
    targetId: string,
    actorId: string,
    actorRole: UserRole
  ): Promise<IEmployee> {
    if (!Types.ObjectId.isValid(targetId)) {
      throw new ValidationError("Invalid employee ID format.");
    }

    if (targetId === actorId) {
      throw new ValidationError("You cannot deactivate your own account.");
    }

    const targetEmployee: IUserDocument | null = await this.repository.findEmployeeById(targetId);
    if (!targetEmployee) {
      throw new NotFoundError("Employee not found.");
    }

    if (actorRole === "HR" && targetEmployee.role !== "EMPLOYEE") {
      throw new ForbiddenError("HR users cannot deactivate HR or Admin accounts.");
    }

    if (targetEmployee.status === "INACTIVE") {
      throw new ValidationError("Employee is already inactive.");
    }

    const updatedEmployee: IUserDocument | null = await this.repository.updateEmployeeStatus(
      targetId,
      "INACTIVE",
      new Date(),
      null // Nullify sessionId to terminate active user session immediately
    );

    if (!updatedEmployee) {
      throw new NotFoundError("Employee not found.");
    }

    return this.mapToSanitizedEmployee(updatedEmployee);
  }

  /**
   * Reactivates an employee account:
   * - Enforces HR ceiling barrier (HR cannot reactivate HR or Admin accounts)
   * - Resets status to ACTIVE and clears deactivatedAt timestamp
   */
  public async reactivateEmployeeService(
    targetId: string,
    actorRole: UserRole
  ): Promise<IEmployee> {
    if (!Types.ObjectId.isValid(targetId)) {
      throw new ValidationError("Invalid employee ID format.");
    }

    const targetEmployee: IUserDocument | null = await this.repository.findEmployeeById(targetId);
    if (!targetEmployee) {
      throw new NotFoundError("Employee not found.");
    }

    if (actorRole === "HR" && targetEmployee.role !== "EMPLOYEE") {
      throw new ForbiddenError("HR users cannot reactivate HR or Admin accounts.");
    }

    if (targetEmployee.status === "ACTIVE") {
      throw new ValidationError("Employee is already active.");
    }

    const updatedEmployee: IUserDocument | null = await this.repository.updateEmployeeStatus(
      targetId,
      "ACTIVE",
      null, // Clear deactivatedAt
      null
    );

    if (!updatedEmployee) {
      throw new NotFoundError("Employee not found.");
    }

    return this.mapToSanitizedEmployee(updatedEmployee);
  }

  /**
   * Updates an existing employee or staff record with strict RBAC enforcement:
   * - HR can only update standard EMPLOYEE records
   * - HR cannot elevate roles to HR/ADMIN or assign HR/Admin designations
   * - ADMIN can update HR and EMPLOYEE records
   */
  public async updateEmployeeService(
    targetId: string,
    input: UpdateEmployeeInput,
    _actorId: string,
    actorRole: UserRole
  ): Promise<IEmployee> {
    if (!Types.ObjectId.isValid(targetId)) {
      throw new ValidationError("Invalid employee ID format.");
    }

    const targetEmployee: IUserDocument | null = await this.repository.findEmployeeById(targetId);
    if (!targetEmployee) {
      throw new NotFoundError("Employee not found.");
    }

    // Strict HR Barrier: HR users can only edit standard EMPLOYEE accounts
    if (actorRole === "HR") {
      if (targetEmployee.role !== "EMPLOYEE") {
        throw new ForbiddenError("HR users cannot update HR or Admin accounts.");
      }

      if (input.role && input.role !== "EMPLOYEE") {
        throw new ForbiddenError("HR users cannot assign HR or Admin roles.");
      }

      if (input.designation && /^(hr|admin)/i.test(input.designation.trim())) {
        throw new ForbiddenError("HR users cannot assign HR or Admin designations.");
      }
    }

    const updatePayload: Partial<IUser> = {};
    if (input.username !== undefined) updatePayload.username = input.username.trim();

    // Email update with duplicate collision check
    if (input.email !== undefined && input.email.trim()) {
      const normalizedEmail: string = input.email.trim().toLowerCase();
      if (normalizedEmail !== targetEmployee.email.toLowerCase()) {
        const emailCollision: IUserDocument | null = await this.repository.findEmployeeByEmail(
          normalizedEmail
        );
        if (emailCollision && emailCollision._id.toString() !== targetId) {
          throw new ConflictError(`An employee with email "${normalizedEmail}" already exists.`);
        }
        updatePayload.email = normalizedEmail;
      }
    }

    // Password update with secure bcrypt hashing
    if (input.password !== undefined && input.password.trim().length > 0) {
      const hashedPassword: string = await bcrypt.hash(input.password.trim(), this.saltRounds);
      updatePayload.password = hashedPassword;
      updatePayload.sessionId = null; // Invalidate active session so employee authenticates with new credentials
    }

    if (input.phone !== undefined) updatePayload.phone = input.phone.trim();
    if (input.department !== undefined) updatePayload.department = input.department.trim();
    if (input.designation !== undefined) updatePayload.designation = input.designation.trim();
    if (input.monthlySalary !== undefined) updatePayload.monthlySalary = input.monthlySalary;
    if (input.role !== undefined) updatePayload.role = input.role;
    if (input.joiningDate !== undefined) {
      updatePayload.joiningDate =
        typeof input.joiningDate === "string" ? new Date(input.joiningDate) : input.joiningDate;
    }

    const updatedEmployee: IUserDocument | null = await this.repository.updateEmployee(
      targetId,
      updatePayload
    );

    if (!updatedEmployee) {
      throw new NotFoundError("Employee not found.");
    }

    return this.mapToSanitizedEmployee(updatedEmployee);
  }

  /**
   * Sanitizes Mongoose document into a strict IEmployee representation.
   */
  private mapToSanitizedEmployee(doc: IUserDocument): IEmployee {
    return {
      id: doc._id.toString(),
      username: doc.username,
      email: doc.email,
      role: doc.role,
      phone: doc.phone ?? "",
      department: doc.department ?? "",
      designation: doc.designation ?? "",
      monthlySalary: doc.monthlySalary ?? 0,
      status: doc.status,
      joiningDate: doc.joiningDate instanceof Date ? doc.joiningDate.toISOString() : String(doc.joiningDate),
      createdBy: doc.createdBy ? doc.createdBy.toString() : null,
      sessionId: doc.sessionId ?? null,
      deactivatedAt: doc.deactivatedAt
        ? doc.deactivatedAt instanceof Date
          ? doc.deactivatedAt.toISOString()
          : String(doc.deactivatedAt)
        : null,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
      updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
    };
  }
}

export const employeeService = new EmployeeService();
