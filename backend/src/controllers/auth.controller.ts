import { Request, Response } from "express";
import { authService, AuthService } from "../services/auth.service";
import { AuthenticationError, ForbiddenError } from "../utils/errors";
import { ILoginRequestBody, ILoginResponse } from "../types/auth.types";

export class AuthController {
  private readonly service: AuthService;

  constructor(service: AuthService = authService) {
    this.service = service;
  }

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as ILoginRequestBody;

      if (!email || !password || typeof email !== "string" || typeof password !== "string") {
        res.status(400).json({
          status: "fail",
          message: "Email and password are required.",
        });
        return;
      }

      const trimmedEmail: string = email.trim();
      const result: ILoginResponse = await this.service.loginAdminService(trimmedEmail, password);

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(401).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      if (error instanceof ForbiddenError) {
        res.status(403).json({
          status: "fail",
          message: error.message,
        });
        return;
      }

      const message: string = error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({
        status: "error",
        message,
      });
    }
  }
}

export const authController = new AuthController();
