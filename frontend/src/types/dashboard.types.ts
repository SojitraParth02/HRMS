import { ReactNode } from "react";

export interface MetricCardData {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  iconBg: string;
  iconColor: string;
  glowBg: string;
  icon: ReactNode;
}

export interface AttendanceStatusItem {
  label: string;
  count: number;
  percentage: string;
  dotColor: string;
  textColor: string;
}

export interface PayrollStatusItem {
  label: string;
  count: number;
  dotColor: string;
}
