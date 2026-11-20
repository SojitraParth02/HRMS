import type { Metadata } from "next";
import { PayrollView } from "../../../components/payroll/PayrollView";

export const metadata: Metadata = {
  title: "Payroll & Compensation | HRMS",
  description: "Workforce salary disbursements, overtime calculations, and monthly payslips",
};

export default function PayrollPage() {
  return <PayrollView />;
}
