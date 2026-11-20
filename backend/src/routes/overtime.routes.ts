import { Router } from "express";
import { overtimeController } from "../controllers/overtime.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import {
  createOvertimeSchema,
  reviewOvertimeSchema,
} from "../types/overtime.types";

const overtimeRouter: Router = Router();

// All routes require authentication
overtimeRouter.use(verifyToken);

// Employee Self-Service Endpoints
overtimeRouter.post(
  "/",
  validateBody(createOvertimeSchema),
  overtimeController.submitOvertime
);
overtimeRouter.get("/my", overtimeController.getMyOvertime);

// HR / Admin Management Endpoints
overtimeRouter.get(
  "/all",
  authorizeRoles("ADMIN", "HR"),
  overtimeController.getAllOvertime
);

overtimeRouter.patch(
  "/:id/review",
  authorizeRoles("ADMIN", "HR"),
  validateBody(reviewOvertimeSchema),
  overtimeController.reviewOvertime
);

export default overtimeRouter;
