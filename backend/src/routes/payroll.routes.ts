import { Router } from "express";
import { payrollController } from "../controllers/payroll.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import {
  runPayrollSchema,
  adjustPayrollSchema,
  finalizePayrollSchema,
  markPaidSchema,
  markMonthPaidSchema,
} from "../types/payroll.types";

const payrollRouter: Router = Router();

// All payroll routes require authentication
payrollRouter.use(verifyToken);

// Employee Self-Service Endpoints
payrollRouter.get("/my-payslips", payrollController.getMyPayslips);
payrollRouter.get("/:id/payslip", payrollController.getPayslipDetails);

// Management & HR Review / Execution Endpoints (ADMIN, HR only)
payrollRouter.post(
  "/run",
  authorizeRoles("ADMIN", "HR"),
  validateBody(runPayrollSchema),
  payrollController.runPayroll
);

payrollRouter.get(
  "/",
  authorizeRoles("ADMIN", "HR"),
  payrollController.getPayrollRecords
);

payrollRouter.patch(
  "/:id/adjust",
  authorizeRoles("ADMIN", "HR"),
  validateBody(adjustPayrollSchema),
  payrollController.adjustPayroll
);

payrollRouter.post(
  "/finalize",
  authorizeRoles("ADMIN", "HR"),
  validateBody(finalizePayrollSchema),
  payrollController.finalizePayroll
);

payrollRouter.patch(
  "/:id/pay",
  authorizeRoles("ADMIN", "HR"),
  validateBody(markPaidSchema),
  payrollController.markPayrollPaid
);

payrollRouter.post(
  "/pay-month",
  authorizeRoles("ADMIN", "HR"),
  validateBody(markMonthPaidSchema),
  payrollController.markMonthPayrollPaid
);

export default payrollRouter;
