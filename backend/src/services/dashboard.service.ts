import { dashboardRepository, DashboardRepository } from "../repositories/dashboard.repository";
import { DashboardStatsData } from "../types/dashboard.types";

export class DashboardService {
  constructor(private repository: DashboardRepository = dashboardRepository) {}

  public async getDashboardStatsService(
    queryMonthYear?: string,
    queryDate?: string,
    role: string = "ADMIN",
    employeeId?: string
  ): Promise<DashboardStatsData> {
    const today = new Date();
    const defaultDate = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const defaultMonthYear = defaultDate.slice(0, 7); // YYYY-MM

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const monthYearRegex = /^\d{4}-\d{2}$/;

    const date = queryDate && dateRegex.test(queryDate.trim())
      ? queryDate.trim()
      : defaultDate;

    const monthYear = queryMonthYear && monthYearRegex.test(queryMonthYear.trim())
      ? queryMonthYear.trim()
      : defaultMonthYear;

    return this.repository.getAggregatedDashboardStats(date, monthYear, role, employeeId);
  }
}

export const dashboardService = new DashboardService();
