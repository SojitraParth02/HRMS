import cron from "node-cron";
import { employeeRepository } from "../repositories/employee.repository";

/**
 * Executes the cleanup routine:
 * Permanently deletes any user record with status 'INACTIVE' whose
 * deactivatedAt timestamp is older than or equal to 30 days ago.
 */
export const runEmployeeCleanupJob = async (): Promise<number> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deletedCount: number = await employeeRepository.deleteExpiredInactiveEmployees(
    thirtyDaysAgo
  );

  console.log(
    `[CRON: Cleanup] ${new Date().toISOString()} - Successfully purged ${deletedCount} expired inactive employee(s) deactivated prior to ${thirtyDaysAgo.toISOString()}.`
  );

  return deletedCount;
};

/**
 * Initializes the automated midnight cron scheduler.
 * Cron pattern '0 0 * * *' fires at 00:00:00 every single night.
 */
export const initEmployeeCleanupCron = (): void => {
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log(`[CRON: Cleanup] Starting scheduled midnight 30-day employee cleanup...`);
      await runEmployeeCleanupJob();
    } catch (error) {
      console.error("[CRON: Cleanup] Fatal error executing scheduled cleanup:", error);
    }
  });

  console.log("[CRON] Midnight 30-day employee cleanup scheduler initialized (0 0 * * *).");
};
