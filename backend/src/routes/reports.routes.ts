import { Router } from "express";
import { reportsController } from "../controllers/reports.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";

const reportsRouter: Router = Router();

// Protect all reporting endpoints: require active session with ADMIN or HR authority
reportsRouter.use(verifyToken, authorizeRoles("ADMIN", "HR"));

// 1. Attendance Report (Date Range)
reportsRouter.get("/attendance", reportsController.getAttendanceReport);

// 2. Payroll & Salary Expenditure Report (Month-Year)
reportsRouter.get("/payroll", reportsController.getPayrollReport);

// 3. Overtime Utilization Report (Month-Year)
reportsRouter.get("/overtime", reportsController.getOvertimeReport);

export default reportsRouter;
