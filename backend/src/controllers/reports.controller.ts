import { Request, Response } from "express";
import { reportsService, ReportsService } from "../services/reports.service";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../utils/errors";

export class ReportsController {
  constructor(private readonly service: ReportsService = reportsService) {}

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

    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ status: "error", message });
  }

  public getAttendanceReport = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { startDate, endDate, department } = req.query;
      const data = await this.service.getAttendanceReport(
        startDate,
        endDate,
        department
      );
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getPayrollReport = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { monthYear, department } = req.query;
      const data = await this.service.getPayrollReport(monthYear, department);
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getOvertimeReport = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { monthYear, department } = req.query;
      const data = await this.service.getOvertimeReport(monthYear, department);
      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
}

export const reportsController = new ReportsController();
