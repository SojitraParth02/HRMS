import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authService } from "../services/auth.service";
import { IJwtPayload } from "../types/auth.types";
import { UserRole, USER_ROLES } from "../types/employee.types";

const isJwtPayloadObject = (value: jwt.JwtPayload | string): value is jwt.JwtPayload => {
  return typeof value === "object" && value !== null;
};

const hasValidUserPayload = (payload: jwt.JwtPayload): payload is jwt.JwtPayload & IJwtPayload => {
  return (
    typeof payload.id === "string" &&
    typeof payload.email === "string" &&
    typeof payload.username === "string" &&
    typeof payload.role === "string" &&
    USER_ROLES.includes(payload.role as UserRole) &&
    typeof payload.sessionId === "string"
  );
};

/**
 * Middleware that validates the incoming Bearer JWT and confirms the active session.
 * Attaches the authenticated user payload to `req.user`.
 */
export const verifyToken = async (
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

    if (!isJwtPayloadObject(decoded) || !hasValidUserPayload(decoded)) {
      res.status(401).json({
        status: "fail",
        message: "Invalid token payload structure.",
      });
      return;
    }

    const isSessionActive: boolean = await authService.validateUserSessionService(
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
      role: decoded.role as UserRole,
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

/**
 * Role-based authorization middleware factory.
 * Restricts route access to users with one of the allowed roles.
 * Returns HTTP 403 Forbidden if not authorized.
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: "fail",
        message: "Unauthorized: Authentication required.",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: "fail",
        message: "Forbidden: You do not have permission to perform this action.",
      });
      return;
    }

    next();
  };
};

/**
 * Backwards-compatible admin-only token verification middleware.
 */
export const verifyAdminToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await verifyToken(req, res, () => {
    if (!req.user || req.user.role !== "ADMIN") {
      res.status(403).json({
        status: "fail",
        message: "Forbidden: Administrator privileges required.",
      });
      return;
    }
    next();
  });
};
