import type { Metadata } from "next";
import { EmployeesView } from "../../../components/employees/EmployeesView";

export const metadata: Metadata = {
  title: "Employee Directory | HRMS",
  description: "Manage employee profiles, departmental allocations, and account statuses",
};

export default function EmployeesPage() {
  return <EmployeesView />;
}
