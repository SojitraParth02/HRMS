import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";

export interface IValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Higher-order middleware factory that validates incoming request body against a Zod schema.
 * Responds with HTTP 400 Bad Request and clean, formatted error messages on failure.
 */
export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parseResult = schema.safeParse(req.body);

    if (!parseResult.success) {
      const error: ZodError = parseResult.error;
      const formattedErrors: IValidationErrorDetail[] = error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      res.status(400).json({
        status: "fail",
        message: formattedErrors[0]?.message ?? "Validation failed.",
        errors: formattedErrors,
      });
      return;
    }

    req.body = parseResult.data;
    next();
  };
};
