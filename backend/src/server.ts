import express, { Express, Request, Response } from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import { initEmployeeCleanupCron } from "./cron/employeeCleanup.cron";
import { seedDefaultCompanySettings } from "./utils/seedSettings";
import { initSocketServer } from "./socket";
import authRouter from "./routes/auth.routes";
import employeeRouter from "./routes/employee.routes";
import notificationRouter from "./routes/notification.routes";
import attendanceRouter from "./routes/attendance.routes";
import leaveRouter from "./routes/leave.routes";
import settingsRouter from "./routes/settings.routes";
import overtimeRouter from "./routes/overtime.routes";
import salaryAdvanceRouter from "./routes/salaryAdvance.routes";
import payrollRouter from "./routes/payroll.routes";

dotenv.config();

const app: Express = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

app.use(cors());
app.use(express.json());

// Base Health Check
app.get("/", (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "success",
    message: "HRMS Backend API is running",
  });
});

// Mount Routes
app.use("/api/auth", authRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/leaves", leaveRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/overtime", overtimeRouter);
app.use("/api/advances", salaryAdvanceRouter);
app.use("/api/payroll", payrollRouter);

const httpServer: http.Server = http.createServer(app);

// Initialize Socket.io Server
initSocketServer(httpServer);

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    initEmployeeCleanupCron();
    await seedDefaultCompanySettings();

    httpServer.listen(port, (): void => {
      console.log(`Server is running on port ${port} with Socket.io enabled`);
    });
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error(`Failed to start server: ${errorMessage}`);
    process.exit(1);
  }
};

void startServer();

export { app, httpServer };
export default app;
