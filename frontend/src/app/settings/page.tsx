"use client";

import React from "react";
import DashboardLayout from "../dashboard/layout";
import { SettingsView } from "../../components/settings/SettingsView";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsView />
    </DashboardLayout>
  );
}
