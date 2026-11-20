import { Router, Request, Response } from "express";
import { employeeController } from "../controllers/employee.controller";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { createEmployeeSchema, updateEmployeeSchema } from "../types/employee.types";

const employeeRouter: Router = Router();

/**
 * All employee routes require a valid authenticated bearer session.
 */
employeeRouter.use(verifyToken);

/**
 * GET /api/employees
 * Retrieves the roster of employees (passwords excluded).
 * Accessible to all authenticated users (ADMIN, HR, EMPLOYEE) for directory viewing.
 */
employeeRouter.get(
  "/",
  authorizeRoles("ADMIN", "HR", "EMPLOYEE"),
  (req: Request, res: Response): Promise<void> => {
    return employeeController.getEmployees(req, res);
  }
);

/**
 * POST /api/employees
 * Creates a new employee with symmetric Zod schema validation and RBAC checks.
 * Restricted to ADMIN and HR roles only.
 */
employeeRouter.post(
  "/",
  authorizeRoles("ADMIN", "HR"),
  validateBody(createEmployeeSchema),
  (req: Request, res: Response): Promise<void> => {
    return employeeController.createEmployee(req, res);
  }
);

/**
 * PUT /api/employees/:id
 * Updates an existing employee with symmetric Zod schema validation and RBAC checks.
 * Restricted to ADMIN and HR roles only.
 */
employeeRouter.put(
  "/:id",
  authorizeRoles("ADMIN", "HR"),
  validateBody(updateEmployeeSchema),
  (req: Request, res: Response): Promise<void> => {
    return employeeController.updateEmployee(req, res);
  }
);

/**
 * PATCH /api/employees/:id/deactivate
 * Soft-deletes (deactivates) an employee account and terminates active session.
 * Restricted to ADMIN and HR roles only.
 */
employeeRouter.patch(
  "/:id/deactivate",
  authorizeRoles("ADMIN", "HR"),
  (req: Request, res: Response): Promise<void> => {
    return employeeController.deactivateEmployee(req, res);
  }
);

/**
 * PATCH /api/employees/:id/reactivate
 * Restores a deactivated employee account to ACTIVE status.
 * Restricted to ADMIN and HR roles only.
 */
employeeRouter.patch(
  "/:id/reactivate",
  authorizeRoles("ADMIN", "HR"),
  (req: Request, res: Response): Promise<void> => {
    return employeeController.reactivateEmployee(req, res);
  }
);

export default employeeRouter;
