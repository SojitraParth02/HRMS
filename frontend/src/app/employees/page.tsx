"use client";

import React from "react";
import DashboardLayout from "../dashboard/layout";
import { EmployeesView } from "../../components/employees/EmployeesView";

export default function EmployeesPage() {
  return (
    <DashboardLayout>
      <EmployeesView />
    </DashboardLayout>
  );
}
