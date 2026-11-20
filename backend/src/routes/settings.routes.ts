import { Router } from "express";
import { settingsController } from "../controllers/settings.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { updateSettingsSchema } from "../types/settings.types";

const settingsRouter: Router = Router();

// All settings routes require authentication
settingsRouter.use(verifyToken);

// All authenticated users can view company settings
settingsRouter.get("/", settingsController.getSettings);

// Only ADMIN and HR can modify company settings
settingsRouter.put(
  "/",
  authorizeRoles("ADMIN", "HR"),
  validateBody(updateSettingsSchema),
  settingsController.updateSettings
);

export default settingsRouter;
