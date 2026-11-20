import { notificationRepository, NotificationRepository } from "../repositories/notification.repository";
import { INotificationDocument } from "../models/notification.model";
import { UserRole } from "../types/employee.types";

export interface NotificationsResponse {
  notifications: INotificationDocument[];
  unreadCount: number;
}

export class NotificationService {
  constructor(private readonly repo: NotificationRepository = notificationRepository) {}

  public async getUserNotifications(
    userId: string,
    role: UserRole
  ): Promise<NotificationsResponse> {
    const [notifications, unreadCount] = await Promise.all([
      this.repo.findRecentByUserOrRole(userId, role),
      this.repo.countUnreadByUserOrRole(userId, role),
    ]);

    return { notifications, unreadCount };
  }

  public async markNotificationRead(notificationId: string): Promise<INotificationDocument | null> {
    return await this.repo.markAsRead(notificationId);
  }

  public async markAllNotificationsRead(userId: string, role: UserRole): Promise<void> {
    await this.repo.markAllAsReadByUserOrRole(userId, role);
  }
}

export const notificationService = new NotificationService();
