import { Router } from "express";
import { salaryAdvanceController } from "../controllers/salaryAdvance.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { createAdvanceSchema } from "../types/salaryAdvance.types";

const salaryAdvanceRouter: Router = Router();

// All routes require authentication
salaryAdvanceRouter.use(verifyToken);

// Employee Self-Service Endpoint
salaryAdvanceRouter.get("/my", salaryAdvanceController.getMyAdvances);

// HR / Admin Management Endpoints
salaryAdvanceRouter.post(
  "/",
  authorizeRoles("ADMIN", "HR"),
  validateBody(createAdvanceSchema),
  salaryAdvanceController.logAdvance
);

salaryAdvanceRouter.get(
  "/",
  authorizeRoles("ADMIN", "HR"),
  salaryAdvanceController.getAllAdvances
);

export default salaryAdvanceRouter;
