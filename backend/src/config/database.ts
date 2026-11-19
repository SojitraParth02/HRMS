import mongoose from "mongoose";

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri: string | undefined = process.env.MONGODB_URI ?? process.env.MONGO_URI;

    if (!mongoUri) {
      console.error("Database connection error: MONGODB_URI is not defined.");
      process.exit(1);
      return;
    }

    await mongoose.connect(mongoUri);
    console.log("Database connected successfully");
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error(`Database connection failed: ${errorMessage}`);
    process.exit(1);
  }
};
