import { Request, Response } from "express";
import {
  attendanceService,
  AttendanceService,
} from "../services/attendance.service";
import { biometricImportService } from "../services/biometricImport.service";
import {
  ValidationError,
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../utils/errors";
import { CorrectionStatus } from "../models/attendanceCorrection.model";
import { formatPaginatedResponse } from "../utils/pagination";

export class AttendanceController {
  constructor(
    private readonly service: AttendanceService = attendanceService
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

  public punchIn = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const attendance = await this.service.punchIn(user.id);
      res.status(200).json({
        status: "success",
        message: "Punched in successfully.",
        data: { attendance },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public punchOut = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const attendance = await this.service.punchOut(user.id);
      res.status(200).json({
        status: "success",
        message: "Punched out successfully.",
        data: { attendance },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getToday = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const result = await this.service.getTodayAttendance(user.id);
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getMyHistory = async (req: Request, res: Response): Promise<void> => {
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
      const startDate = req.query.startDate
        ? String(req.query.startDate)
        : undefined;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

      const result = await this.service.getMyHistory(
        user.id,
        page,
        limit,
        startDate,
        endDate
      );

      res.status(200).json(formatPaginatedResponse(result.records, page, limit, result.total));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getAllRoster = async (req: Request, res: Response): Promise<void> => {
    try {
      const date = req.query.date ? String(req.query.date) : undefined;
      const department = req.query.department
        ? String(req.query.department)
        : undefined;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
      const search = req.query.search ? String(req.query.search) : undefined;

      const { roster, total } = await this.service.getAllAttendanceRoster(
        date,
        department,
        page,
        limit,
        search
      );
      res.status(200).json(formatPaginatedResponse(roster, page, limit, total));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public submitCorrection = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const correction = await this.service.submitCorrectionRequest(
        user.id,
        req.body
      );

      res.status(201).json({
        status: "success",
        message: "Correction request submitted successfully.",
        data: { correction },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getCorrections = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const status = req.query.status
        ? (String(req.query.status) as CorrectionStatus)
        : undefined;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
      const { corrections, total } = await this.service.getCorrections(status, page, limit);

      res.status(200).json(formatPaginatedResponse(corrections, page, limit, total));
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public reviewCorrection = async (
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
      const correction = await this.service.reviewCorrection(
        id,
        user.id,
        user.role,
        req.body
      );

      res.status(200).json({
        status: "success",
        message: `Correction request has been ${req.body.status.toLowerCase()} successfully.`,
        data: { correction },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public importBiometricCSV = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      if (!req.file) {
        res
          .status(400)
          .json({ status: "error", message: "No CSV file uploaded. Please attach a file." });
        return;
      }

      const result = await biometricImportService.importCSV(
        req.file.buffer,
        req.file.originalname,
        user.id
      );

      res.status(200).json({
        status: "success",
        message: `Biometric import completed: ${result.successfulRows} of ${result.totalRows} records successfully processed.`,
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getImportHistory = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const history = await biometricImportService.getImportHistory();
      res.status(200).json({
        status: "success",
        data: { history },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
}

export const attendanceController = new AttendanceController();
