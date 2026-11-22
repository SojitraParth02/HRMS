import { Request, Response } from "express";
import { employeeService, EmployeeService } from "../services/employee.service";
import { CreateEmployeeInput, UpdateEmployeeInput, IEmployee, UserRole } from "../types/employee.types";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../utils/errors";
import { formatPaginatedResponse } from "../utils/pagination";

export class EmployeeController {
  private readonly service: EmployeeService;

  constructor(service: EmployeeService = employeeService) {
    this.service = service;
  }

  /**
   * HTTP POST handler to create a new employee.
   * Expects authenticated user context with verified role and validated request payload.
   */
  public async createEmployee(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          status: "fail",
          message: "Unauthorized: User session required.",
        });
        return;
      }

      const input = req.body as CreateEmployeeInput;
      const creatorId: string = req.user.id;
      const creatorRole: UserRole = req.user.role;

      const employee: IEmployee = await this.service.createEmployeeService(
        input,
        creatorId,
        creatorRole
      );

      res.status(201).json({
        status: "success",
        message: "Employee created successfully.",
        data: {
          employee,
        },
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        res.status(409).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      if (error instanceof ForbiddenError) {
        res.status(403).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      const message: string = error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        status: "error",
        message,
      });
    }
  }

  /**
   * HTTP GET handler to retrieve the list of all registered employees.
   */
  public async getEmployees(req: Request, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
      const search = req.query.search ? String(req.query.search) : undefined;
      const department = req.query.department ? String(req.query.department) : undefined;
      const role = req.query.role ? String(req.query.role) : undefined;
      const requesterId = req.user?.id;
      const requesterRole = req.user?.role;

      const { employees, total } = await this.service.getPaginatedEmployeesService(
        page,
        limit,
        search,
        department,
        role,
        requesterId,
        requesterRole
      );

      res.status(200).json(formatPaginatedResponse(employees, page, limit, total));
    } catch (error) {
      const message: string = error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        status: "error",
        message,
      });
    }
  }

  /**
   * HTTP PATCH handler to deactivate (soft delete) an employee account.
   */
  public async deactivateEmployee(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          status: "fail",
          message: "Unauthorized: User session required.",
        });
        return;
      }

      const targetId = req.params.id as string;
      const actorId: string = req.user.id;
      const actorRole: UserRole = req.user.role;

      const employee: IEmployee = await this.service.deactivateEmployeeService(
        targetId,
        actorId,
        actorRole
      );

      res.status(200).json({
        status: "success",
        message: "Employee deactivated successfully.",
        data: {
          employee,
        },
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        res.status(409).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      if (error instanceof NotFoundError) {
        res.status(404).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      if (error instanceof ForbiddenError) {
        res.status(403).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      const message: string = error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        status: "error",
        message,
      });
    }
  }

  /**
   * HTTP PATCH handler to reactivate an employee account.
   */
  public async reactivateEmployee(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          status: "fail",
          message: "Unauthorized: User session required.",
        });
        return;
      }

      const targetId = req.params.id as string;
      const actorRole: UserRole = req.user.role;

      const employee: IEmployee = await this.service.reactivateEmployeeService(
        targetId,
        actorRole
      );

      res.status(200).json({
        status: "success",
        message: "Employee reactivated successfully.",
        data: {
          employee,
        },
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        res.status(409).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      if (error instanceof NotFoundError) {
        res.status(404).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      if (error instanceof ForbiddenError) {
        res.status(403).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      const message: string = error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        status: "error",
        message,
      });
    }
  }

  /**
   * HTTP PUT handler to update an existing employee.
   * Expects authenticated user context with verified role and validated request payload.
   */
  public async updateEmployee(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          status: "fail",
          message: "Unauthorized: User session required.",
        });
        return;
      }

      const targetId = req.params.id as string;
      const input = req.body as UpdateEmployeeInput;
      const actorId: string = req.user.id;
      const actorRole: UserRole = req.user.role;

      const employee: IEmployee = await this.service.updateEmployeeService(
        targetId,
        input,
        actorId,
        actorRole
      );

      res.status(200).json({
        status: "success",
        message: "Employee updated successfully.",
        data: {
          employee,
        },
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        res.status(409).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      if (error instanceof NotFoundError) {
        res.status(404).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      if (error instanceof ForbiddenError) {
        res.status(403).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      const message: string = error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        status: "error",
        message,
      });
    }
  }
}

export const employeeController = new EmployeeController();
