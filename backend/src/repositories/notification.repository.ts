import { Types } from "mongoose";
import {
  NotificationModel,
  INotification,
  INotificationDocument,
} from "../models/notification.model";

export class NotificationRepository {
  public async createNotification(
    data: INotification
  ): Promise<INotificationDocument> {
    return await NotificationModel.create(data);
  }

  public async findRecentByUserOrRole(
    userId: string,
    role?: string,
    limit: number = 20
  ): Promise<INotificationDocument[]> {
    const userObjectId = new Types.ObjectId(userId);

    if (role === "HR" || role === "ADMIN") {
      return await NotificationModel.find({
        $or: [
          { recipientId: userObjectId },
          { targetRole: { $in: ["HR", "ADMIN"] } },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();
    }

    return await NotificationModel.find({
      recipientId: userObjectId,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  public async countUnreadByUserOrRole(
    userId: string,
    role?: string
  ): Promise<number> {
    const userObjectId = new Types.ObjectId(userId);

    if (role === "HR" || role === "ADMIN") {
      return await NotificationModel.countDocuments({
        isRead: false,
        $or: [
          { recipientId: userObjectId },
          { targetRole: { $in: ["HR", "ADMIN"] } },
        ],
      }).exec();
    }

    return await NotificationModel.countDocuments({
      recipientId: userObjectId,
      isRead: false,
    }).exec();
  }

  public async markAsRead(
    notificationId: string
  ): Promise<INotificationDocument | null> {
    return await NotificationModel.findByIdAndUpdate(
      notificationId,
      { $set: { isRead: true } },
      { returnDocument: "after" }
    ).exec();
  }

  public async markAllAsReadByUserOrRole(
    userId: string,
    role?: string
  ): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);

    if (role === "HR" || role === "ADMIN") {
      await NotificationModel.updateMany(
        {
          isRead: false,
          $or: [
            { recipientId: userObjectId },
            { targetRole: { $in: ["HR", "ADMIN"] } },
          ],
        },
        { $set: { isRead: true } }
      ).exec();
      return;
    }

    await NotificationModel.updateMany(
      { recipientId: userObjectId, isRead: false },
      { $set: { isRead: true } }
    ).exec();
  }
}

export const notificationRepository = new NotificationRepository();
