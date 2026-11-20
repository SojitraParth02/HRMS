import type { Metadata } from "next";
import { ReportsView } from "../../../components/reports/ReportsView";

export const metadata: Metadata = {
  title: "Reports & Analytics | HRMS",
  description: "Workforce attendance, payroll expenditure, and overtime analytics with RFC-4180 CSV export",
};

export default function ReportsPage() {
  return <ReportsView />;
}
