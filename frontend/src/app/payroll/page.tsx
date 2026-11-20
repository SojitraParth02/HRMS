"use client";

import React from "react";
import DashboardLayout from "../dashboard/layout";
import { PayrollView } from "../../components/payroll/PayrollView";

export default function PayrollPage() {
  return (
    <DashboardLayout>
      <PayrollView />
    </DashboardLayout>
  );
}
