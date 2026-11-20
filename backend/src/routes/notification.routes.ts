import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { verifyToken } from "../middleware/auth.middleware";

const notificationRouter: Router = Router();

// All notification routes require authenticated token
notificationRouter.use(verifyToken);

notificationRouter.get("/", notificationController.getNotifications);
notificationRouter.patch("/mark-all-read", notificationController.markAllAsRead);
notificationRouter.patch("/:id/read", notificationController.markAsRead);

export default notificationRouter;
