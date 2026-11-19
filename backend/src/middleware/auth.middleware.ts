import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authService } from "../services/auth.service";
import { IJwtPayload } from "../types/auth.types";

const isJwtPayloadObject = (value: jwt.JwtPayload | string): value is jwt.JwtPayload => {
  return typeof value === "object" && value !== null;
};

const hasValidAdminPayload = (payload: jwt.JwtPayload): payload is jwt.JwtPayload & IJwtPayload => {
  return (
    typeof payload.id === "string" &&
    typeof payload.email === "string" &&
    typeof payload.username === "string" &&
    payload.role === "ADMIN" &&
    typeof payload.sessionId === "string"
  );
};

export const verifyAdminToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader: string | undefined = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        status: "fail",
        message: "Authorization token missing or invalid format.",
      });
      return;
    }

    const token: string = authHeader.split(" ")[1] ?? "";
    const jwtSecret: string | undefined = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({
        status: "error",
        message: "JWT secret is not configured on server.",
      });
      return;
    }

    const decoded: jwt.JwtPayload | string = jwt.verify(token, jwtSecret);

    if (!isJwtPayloadObject(decoded) || !hasValidAdminPayload(decoded)) {
      res.status(401).json({
        status: "fail",
        message: "Invalid token payload structure.",
      });
      return;
    }

    const isSessionActive: boolean = await authService.validateAdminSessionService(
      decoded.id,
      decoded.sessionId
    );

    if (!isSessionActive) {
      res.status(401).json({
        status: "fail",
        message: "Session expired or terminated by another login.",
      });
      return;
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        status: "fail",
        message: "Token has expired.",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        status: "fail",
        message: "Invalid token.",
      });
      return;
    }

    const message: string = error instanceof Error ? error.message : "Authentication failed.";
    res.status(500).json({
      status: "error",
      message,
    });
  }
};
