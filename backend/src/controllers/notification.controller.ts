import { Request, Response } from "express";
import { notificationService, NotificationService } from "../services/notification.service";
import { UserRole } from "../types/employee.types";

export class NotificationController {
  constructor(private readonly service: NotificationService = notificationService) {}

  public getNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized: Missing user token." });
        return;
      }

      const result = await this.service.getUserNotifications(
        user.id,
        user.role as UserRole
      );

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.status(500).json({ status: "error", message });
    }
  };

  public markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = String(req.params.id);
      const updated = await this.service.markNotificationRead(id);
      if (!updated) {
        res.status(404).json({ status: "error", message: "Notification not found." });
        return;
      }

      res.status(200).json({
        status: "success",
        message: "Notification marked as read.",
        data: { notification: updated },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.status(500).json({ status: "error", message });
    }
  };

  public markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized: Missing user token." });
        return;
      }

      await this.service.markAllNotificationsRead(user.id, user.role as UserRole);

      res.status(200).json({
        status: "success",
        message: "All notifications marked as read.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal Server Error";
      res.status(500).json({ status: "error", message });
    }
  };
}

export const notificationController = new NotificationController();
