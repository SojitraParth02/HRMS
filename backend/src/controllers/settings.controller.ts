import { Request, Response } from "express";
import { Types } from "mongoose";
import {
  settingsRepository,
  SettingsRepository,
} from "../repositories/settings.repository";
import { updateSettingsSchema } from "../types/settings.types";
import {
  ValidationError,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../utils/errors";

export class SettingsController {
  constructor(
    private readonly settingsRepo: SettingsRepository = settingsRepository
  ) {}

  private handleError(error: unknown, res: Response): void {
    if (
      error instanceof ValidationError ||
      error instanceof BadRequestError
    ) {
      res.status(400).json({ status: "error", message: error.message });
      return;
    }
    if (error instanceof ForbiddenError) {
      res.status(403).json({ status: "error", message: error.message });
      return;
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({ status: "error", message: error.message });
      return;
    }

    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ status: "error", message });
  }

  public getSettings = async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.settingsRepo.getSettings();
      res.status(200).json({
        status: "success",
        data: { settings },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };

  public updateSettings = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ status: "error", message: "Unauthorized." });
        return;
      }

      const parseResult = updateSettingsSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errorMessages = parseResult.error.issues
          .map((issue) => issue.message)
          .join(", ");
        throw new ValidationError(errorMessages);
      }

      const updated = await this.settingsRepo.updateSettings({
        ...parseResult.data,
        updatedBy: new Types.ObjectId(user.id),
      });

      if (!updated) {
        throw new NotFoundError("Company settings not found.");
      }

      res.status(200).json({
        status: "success",
        message: "Company settings updated successfully.",
        data: { settings: updated },
      });
    } catch (error) {
      this.handleError(error, res);
    }
  };
}

export const settingsController = new SettingsController();
