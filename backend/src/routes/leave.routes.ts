import { Router } from "express";
import { leaveController } from "../controllers/leave.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { applyLeaveSchema, reviewLeaveSchema } from "../types/leave.types";

const leaveRouter: Router = Router();

// All leave routes require an active authenticated bearer token
leaveRouter.use(verifyToken);

// Employee Self-Service Endpoints
leaveRouter.get("/balance", leaveController.getBalance);
leaveRouter.post(
  "/apply",
  validateBody(applyLeaveSchema),
  leaveController.applyLeave
);
leaveRouter.get("/my-leaves", leaveController.getMyLeaves);

// Management & HR Review Endpoints (ADMIN, HR only)
leaveRouter.get(
  "/all",
  authorizeRoles("ADMIN", "HR"),
  leaveController.getAllLeaves
);

leaveRouter.patch(
  "/:id/review",
  authorizeRoles("ADMIN", "HR"),
  validateBody(reviewLeaveSchema),
  leaveController.reviewLeave
);

export default leaveRouter;
