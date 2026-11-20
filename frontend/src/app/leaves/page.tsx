"use client";

import React from "react";
import DashboardLayout from "../dashboard/layout";
import { LeaveManagementView } from "../../components/leaves/LeaveManagementView";

export default function LeavesPage() {
  return (
    <DashboardLayout>
      <LeaveManagementView />
    </DashboardLayout>
  );
}
