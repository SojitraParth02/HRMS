import { Router } from "express";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { dashboardController } from "../controllers/dashboard.controller";

const router = Router();

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get aggregated real-time executive and workforce dashboard metrics
 * @access  Private (ADMIN, HR, EMPLOYEE - scoped by role)
 */
router.get(
  "/stats",
  verifyToken,
  authorizeRoles("ADMIN", "HR", "EMPLOYEE"),
  dashboardController.getDashboardStats
);

export default router;
