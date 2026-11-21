import type { Metadata } from "next";
import DashboardView from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Executive Dashboard | HRMS Portal",
  description: "Real-time workforce attendance, payroll distribution, and operational metrics.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
