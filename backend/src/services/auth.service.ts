import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { adminRepository, AdminRepository } from "../repositories/admin.repository";
import { IUserDocument } from "../models/user.model";
import { IJwtPayload, ILoginResponse } from "../types/auth.types";
import { AuthenticationError } from "../utils/errors";

export class AuthService {
  private readonly repository: AdminRepository;

  constructor(repository: AdminRepository = adminRepository) {
    this.repository = repository;
  }

  public async loginAdminService(email: string, password: string): Promise<ILoginResponse> {
    const admin: IUserDocument | null = await this.repository.findAdminByEmail(email);

    if (!admin) {
      throw new AuthenticationError("Invalid email or password.");
    }

    const isPasswordValid: boolean = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email or password.");
    }

    const sessionId: string = crypto.randomUUID();
    const adminId: string = admin._id.toString();

    await this.repository.updateAdminSession(adminId, sessionId);

    const jwtSecret: string | undefined = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured on the server.");
    }

    const payload: IJwtPayload = {
      id: adminId,
      email: admin.email,
      username: admin.username,
      role: admin.role,
      sessionId,
    };

    const signOptions: SignOptions = {
      expiresIn: "1d",
    };

    const token: string = jwt.sign(payload, jwtSecret, signOptions);

    return {
      token,
      user: {
        id: adminId,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        sessionId,
      },
    };
  }

  public async validateAdminSessionService(id: string, sessionId: string): Promise<boolean> {
    const admin: IUserDocument | null = await this.repository.findAdminById(id);

    if (!admin) {
      return false;
    }

    return admin.sessionId === sessionId;
  }
}

export const authService = new AuthService();
