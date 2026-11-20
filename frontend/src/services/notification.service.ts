import { apiClient } from "./apiClient";
import {
  NotificationsApiResponse,
  NotificationsData,
  NotificationItem,
} from "../types/notification.types";

/**
 * Fetches recent notifications and unread counter for current user.
 */
export const getNotifications = async (): Promise<NotificationsData> => {
  const response = await apiClient.get<NotificationsApiResponse>(
    "/api/notifications"
  );
  return response.data.data;
};

/**
 * Marks an individual notification as read.
 */
export const markNotificationRead = async (
  notificationId: string
): Promise<NotificationItem> => {
  const response = await apiClient.patch<{
    status: string;
    message: string;
    data: { notification: NotificationItem };
  }>(`/api/notifications/${notificationId}/read`);
  return response.data.data.notification;
};

/**
 * Marks all notifications for the active user/role as read.
 */
export const markAllNotificationsRead = async (): Promise<void> => {
  await apiClient.patch<{
    status: string;
    message: string;
  }>("/api/notifications/mark-all-read");
};
