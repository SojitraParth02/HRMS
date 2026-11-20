import { Request, Response } from "express";
import {
  payrollService,
  PayrollService,
} from "../services/payroll.service";
import {
  ValidationError,
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../utils/errors";
import { PayrollStatus } from "../models/payroll.model";

export class PayrollController {
  constructor(
    private readonly service: PayrollService = payrollService
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

  public runPayroll = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const { monthYear } = req.body;
      const records = await this.service.runPayrollDraft(monthYear, user.id);

      res.status(200).json({
        status: "success",
        message: `Draft payroll generated successfully for ${monthYear}.`,
        data: { payrolls: records, monthYear },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getPayrollRecords = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const monthYear = req.query.monthYear
        ? String(req.query.monthYear)
        : undefined;
      const status = req.query.status as PayrollStatus | undefined;

      const records = await this.service.getPayrollRecords({
        monthYear,
        status,
      });

      res.status(200).json({
        status: "success",
        data: { payrolls: records },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public adjustPayroll = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const id = String(req.params.id);
      const updated = await this.service.updatePayrollAdjustment(id, req.body);

      res.status(200).json({
        status: "success",
        message: "Payroll adjustments updated successfully.",
        data: { payroll: updated },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public finalizePayroll = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const { monthYear } = req.body;
      const result = await this.service.finalizePayroll(monthYear, user.id);

      res.status(200).json({
        status: "success",
        message: `Payroll for ${monthYear} has been finalized and locked.`,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public markPayrollPaid = async (
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
      const updated = await this.service.markRecordPaid(id, req.body, user.id);

      res.status(200).json({
        status: "success",
        message: "Salary marked as paid successfully.",
        data: { payroll: updated },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public markMonthPayrollPaid = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const result = await this.service.markMonthPaid(req.body, user.id);

      res.status(200).json({
        status: "success",
        message: `All finalized salaries for ${result.monthYear} marked as paid (${result.disbursedCount} disbursed).`,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getMyPayslips = async (
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

      const result = await this.service.getUserPayslips(user.id, page, limit);

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getPayslipDetails = async (
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
      const record = await this.service.getPayslipDetails(id, user);

      res.status(200).json({
        status: "success",
        data: { payslip: record },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
}

export const payrollController = new PayrollController();
