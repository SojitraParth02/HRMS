import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import authRouter from "./routes/auth.routes";

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

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();
    app.listen(port, (): void => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error(`Failed to start server: ${errorMessage}`);
    process.exit(1);
  }
};

void startServer();

export default app;
