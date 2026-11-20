import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { UserRole } from "../types/employee.types";

export interface SocketUserPayload {
  id: string;
  email: string;
  role: UserRole;
  sessionId?: string | null;
}

declare module "socket.io" {
  interface Socket {
    user?: SocketUserPayload;
  }
}

let ioInstance: SocketIOServer | null = null;

export const initSocketServer = (httpServer: http.Server): SocketIOServer => {
  const allowedOrigins: string[] = [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  // JWT Handshake Authentication Middleware
  ioInstance.use((socket: Socket, next: (err?: Error) => void) => {
    try {
      const authHeader =
        socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!authHeader) {
        return next(
          new Error("Authentication token required for WebSocket connection")
        );
      }

      const token: string =
        typeof authHeader === "string" && authHeader.startsWith("Bearer ")
          ? authHeader.split(" ")[1]
          : String(authHeader);

      const jwtSecret: string =
        process.env.JWT_SECRET || "default_jwt_secret_change_in_production";
      const decoded = jwt.verify(token, jwtSecret) as SocketUserPayload;

      socket.user = decoded;
      next();
    } catch {
      return next(
        new Error("Invalid or expired WebSocket authentication token")
      );
    }
  });

  ioInstance.on("connection", (socket: Socket) => {
    const user = socket.user;
    if (!user) {
      socket.disconnect();
      return;
    }

    const userRoom: string = `user_${user.id}`;
    void socket.join(userRoom);
    console.log(
      `[Socket] User ${user.email} (${user.role}) connected -> joined ${userRoom}`
    );

    if (user.role === "HR" || user.role === "ADMIN") {
      void socket.join("hr-room");
      console.log(`[Socket] Privileged user ${user.email} joined "hr-room"`);
    }

    socket.on("disconnect", () => {
      console.log(`[Socket] User ${user.email} disconnected`);
    });
  });

  return ioInstance;
};

export const getIO = (): SocketIOServer => {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized yet!");
  }
  return ioInstance;
};

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit(event, data);
  }
};

export const emitToHR = (event: string, data: unknown): void => {
  if (ioInstance) {
    ioInstance.to("hr-room").emit(event, data);
  }
};

export const emitToAll = (event: string, data: unknown): void => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};
