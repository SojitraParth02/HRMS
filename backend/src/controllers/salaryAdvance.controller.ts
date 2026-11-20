import { Request, Response } from "express";
import {
  salaryAdvanceService,
  SalaryAdvanceService,
} from "../services/salaryAdvance.service";
import {
  ValidationError,
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../utils/errors";

export class SalaryAdvanceController {
  constructor(
    private readonly service: SalaryAdvanceService = salaryAdvanceService
  ) {}

  private handleError(error: unknown, res: Response): void {
    if (
      error instanceof ValidationError ||
      error instanceof BadRequestError
    ) {
      res.status(400).json({ status: "error", message: error.message });
      return;
    }
    if (error instanceof ForbiddenError) {
      res.status(403).json({ status: "error", message: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ status: "error", message: error.message });
      return;
    }
    if (error instanceof ConflictError) {
      res.status(409).json({ status: "error", message: error.message });
      return;
    }

    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ status: "error", message });
  }

  public logAdvance = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const advance = await this.service.logAdvance(user.id, req.body);
      res.status(201).json({
        status: "success",
        message: "Salary advance logged successfully.",
        data: { advance },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getAllAdvances = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const monthYear = req.query.monthYear
        ? String(req.query.monthYear)
        : undefined;
      const isDeducted =
        req.query.isDeducted !== undefined
          ? req.query.isDeducted === "true"
          : undefined;
      const userId = req.query.userId ? String(req.query.userId) : undefined;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit
        ? parseInt(String(req.query.limit), 10)
        : 20;

      const result = await this.service.getAllAdvances({
        monthYear,
        isDeducted,
        userId,
        page,
        limit,
      });

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getMyAdvances = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit
        ? parseInt(String(req.query.limit), 10)
        : 20;

      const result = await this.service.getMyAdvances(user.id, page, limit);
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
}

export const salaryAdvanceController = new SalaryAdvanceController();
