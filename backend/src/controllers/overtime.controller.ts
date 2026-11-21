import { Request, Response } from "express";
import {
  overtimeService,
  OvertimeService,
} from "../services/overtime.service";
import {
  ValidationError,
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../utils/errors";
import { OvertimeStatus } from "../models/overtime.model";
import { formatPaginatedResponse } from "../utils/pagination";

export class OvertimeController {
  constructor(
    private readonly service: OvertimeService = overtimeService
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

  public submitOvertime = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const overtime = await this.service.submitOvertime(user.id, req.body);
      res.status(201).json({
        status: "success",
        message: "Overtime request submitted successfully.",
        data: { overtime },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public reviewOvertime = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const id = String(req.params.id);
      const updated = await this.service.reviewOvertime(id, user.id, req.body);

      res.status(200).json({
        status: "success",
        message: `Overtime request ${updated.status.toLowerCase()} successfully.`,
        data: { overtime: updated },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getMyOvertime = async (
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

      const result = await this.service.getMyOvertime(user.id, page, limit);
      res.status(200).json(formatPaginatedResponse(result.records, page, limit, result.total));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getAllOvertime = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const status = req.query.status as OvertimeStatus | undefined;
      const startDate = req.query.startDate
        ? String(req.query.startDate)
        : undefined;
      const endDate = req.query.endDate
        ? String(req.query.endDate)
        : undefined;
      const userId = req.query.userId ? String(req.query.userId) : undefined;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit
        ? parseInt(String(req.query.limit), 10)
        : 20;
      const search = req.query.search ? String(req.query.search) : undefined;

      const result = await this.service.getAllOvertime({
        status,
        startDate,
        endDate,
        userId,
        page,
        limit,
        search,
      });

      res.status(200).json(formatPaginatedResponse(result.records, page, limit, result.total));
    } catch (error) {
      this.handleError(error, res);
    }
  };
}

export const overtimeController = new OvertimeController();
