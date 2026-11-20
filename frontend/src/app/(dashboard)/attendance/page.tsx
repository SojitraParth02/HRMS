import type { Metadata } from "next";
import { AttendanceView } from "../../../components/attendance/AttendanceView";

export const metadata: Metadata = {
  title: "Attendance Management | HRMS",
  description: "Real-time attendance logging, biometric imports, and shift correction approvals",
};

export default function AttendancePage() {
  return <AttendanceView />;
}
