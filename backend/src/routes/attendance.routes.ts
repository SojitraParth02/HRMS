import { Router } from "express";
import multer from "multer";
import { attendanceController } from "../controllers/attendance.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import {
  createCorrectionSchema,
  reviewCorrectionSchema,
} from "../types/attendance.types";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const attendanceRouter: Router = Router();

// All attendance routes require an active authenticated bearer token
attendanceRouter.use(verifyToken);

// Employee Self-Service Punch & History Endpoints
attendanceRouter.post("/punch-in", attendanceController.punchIn);
attendanceRouter.post("/punch-out", attendanceController.punchOut);
attendanceRouter.get("/today", attendanceController.getToday);
attendanceRouter.get("/my-history", attendanceController.getMyHistory);

// Missed Punch Correction Request (Self)
attendanceRouter.post(
  "/correction",
  validateBody(createCorrectionSchema),
  attendanceController.submitCorrection
);

// Management & HR Review Endpoints (ADMIN, HR only)
attendanceRouter.get(
  "/all",
  authorizeRoles("ADMIN", "HR"),
  attendanceController.getAllRoster
);

attendanceRouter.get(
  "/corrections",
  authorizeRoles("ADMIN", "HR"),
  attendanceController.getCorrections
);

attendanceRouter.patch(
  "/corrections/:id/review",
  authorizeRoles("ADMIN", "HR"),
  validateBody(reviewCorrectionSchema),
  attendanceController.reviewCorrection
);

// Biometric CSV Import Endpoints (ADMIN, HR only)
attendanceRouter.post(
  "/import-csv",
  authorizeRoles("ADMIN", "HR"),
  upload.single("file"),
  attendanceController.importBiometricCSV
);

attendanceRouter.get(
  "/import-history",
  authorizeRoles("ADMIN", "HR"),
  attendanceController.getImportHistory
);

export default attendanceRouter;
