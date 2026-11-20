export type NotificationType =
  | "LEAVE_APPLIED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "CORRECTION_REQUESTED"
  | "CORRECTION_APPROVED"
  | "CORRECTION_REJECTED"
  | "OVERTIME_REQUESTED"
  | "OVERTIME_APPROVED"
  | "OVERTIME_REJECTED"
  | "ADVANCE_LOGGED"
  | "PAYROLL_FINALIZED";

export interface NotificationItem {
  _id: string;
  recipientId?: string | null;
  targetRole?: "HR" | "ADMIN" | null;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsData {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface NotificationsApiResponse {
  status: "success" | "error";
  data: NotificationsData;
  message?: string;
}
