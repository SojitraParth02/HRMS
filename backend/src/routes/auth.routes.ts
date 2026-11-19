import { Router, Request, Response } from "express";
import { authController } from "../controllers/auth.controller";
import { verifyAdminToken } from "../middleware/auth.middleware";

const authRouter: Router = Router();

authRouter.post("/login", (req: Request, res: Response): Promise<void> => {
  return authController.login(req, res);
});

// Protected route to test/verify current authenticated session
authRouter.get("/me", verifyAdminToken, (req: Request, res: Response): void => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
});

export default authRouter;
