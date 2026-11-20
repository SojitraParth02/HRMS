import dotenv from "dotenv";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDatabase } from "./config/database";
import { AdminModel, IUserDocument } from "./models/user.model";
import { seedDefaultCompanySettings } from "./utils/seedSettings";

dotenv.config();

const seedAdmin = async (): Promise<void> => {
  const adminEmail: string = "admin@hrms.com";
  const adminUsername: string = "admin";
  const defaultPassword: string = "admin123";
  const saltRounds: number = 10;

  try {
    await connectDatabase();

    const existingAdmin: IUserDocument | null = await AdminModel.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`Admin with email "${adminEmail}" already exists. Skipping seed.`);
    } else {
      const hashedPassword: string = await bcrypt.hash(defaultPassword, saltRounds);

      await AdminModel.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        sessionId: null,
      });

      console.log("Initial Admin successfully created:");
      console.log(`  Email:    ${adminEmail}`);
      console.log(`  Username: ${adminUsername}`);
      console.log(`  Password: ${defaultPassword}`);
    }

    // Seed Default Company Settings
    await seedDefaultCompanySettings();

    await mongoose.disconnect();
    console.log("Database disconnected cleanly.");
    process.exit(0);
  } catch (error) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    console.error(`Error during admin seeding: ${errorMessage}`);
    await mongoose.disconnect().catch((): void => { });
    process.exit(1);
  }
};

void seedAdmin();
