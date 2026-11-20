import type { Metadata } from "next";
import { LeaveManagementView } from "../../../components/leaves/LeaveManagementView";

export const metadata: Metadata = {
  title: "Leave Management | HRMS",
  description: "Annual leave allocations, paid time-off applications, and balance reviews",
};

export default function LeavesPage() {
  return <LeaveManagementView />;
}
