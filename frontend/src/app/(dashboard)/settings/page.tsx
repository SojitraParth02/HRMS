import type { Metadata } from "next";
import { SettingsView } from "../../../components/settings/SettingsView";

export const metadata: Metadata = {
  title: "Company Settings | HRMS",
  description: "Configure corporate working hours, grace periods, shift timings, and leave quotas",
};

export default function SettingsPage() {
  return <SettingsView />;
}
