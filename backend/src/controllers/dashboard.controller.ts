import { Request, Response } from "express";
import { dashboardService, DashboardService } from "../services/dashboard.service";

export class DashboardController {
  constructor(private service: DashboardService = dashboardService) {}

  public getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const monthYear = typeof req.query.monthYear === "string" ? req.query.monthYear : undefined;
      const date = typeof req.query.date === "string" ? req.query.date : undefined;

      const userRole = req.user?.role ?? "ADMIN";
      const userId = req.user?.id;

      const data = await this.service.getDashboardStatsService(monthYear, date, userRole, userId);

      res.status(200).json({
        status: "success",
        data,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to aggregate dashboard metrics.";
      res.status(500).json({
        status: "error",
        message,
      });
    }
  };
}

export const dashboardController = new DashboardController();
