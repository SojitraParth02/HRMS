"use client";

import React from "react";
import DashboardLayout from "../dashboard/layout";
import { AttendanceView } from "../../components/attendance/AttendanceView";

export default function AttendancePage() {
  return (
    <DashboardLayout>
      <AttendanceView />
    </DashboardLayout>
  );
}
