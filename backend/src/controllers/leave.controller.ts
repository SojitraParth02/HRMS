import { Request, Response } from "express";
import { leaveService, LeaveService } from "../services/leave.service";
import {
  ValidationError,
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../utils/errors";
import { LeaveStatus } from "../models/leave.model";

export class LeaveController {
  constructor(private readonly service: LeaveService = leaveService) {}

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

  public getBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const balance = await this.service.getLeaveBalance(user.id);
      res.status(200).json({
        status: "success",
        data: balance,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public applyLeave = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const result = await this.service.applyLeave(user.id, req.body);
      res.status(201).json({
        status: "success",
        message: "Leave application submitted successfully.",
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getMyLeaves = async (req: Request, res: Response): Promise<void> => {
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

      const result = await this.service.getMyLeaves(user.id, page, limit);
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public getAllLeaves = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const status = req.query.status
        ? (String(req.query.status) as LeaveStatus)
        : undefined;
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      const limit = req.query.limit
        ? parseInt(String(req.query.limit), 10)
        : 20;

      const result = await this.service.getAllLeaves(
        user.role,
        status,
        page,
        limit
      );
      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public reviewLeave = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const id = String(req.params.id);
      const leave = await this.service.reviewLeave(
        id,
        user.id,
        user.role,
        req.body
      );

      res.status(200).json({
        status: "success",
        message: `Leave request has been ${req.body.status.toLowerCase()} successfully.`,
        data: { leave },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
}

export const leaveController = new LeaveController();
