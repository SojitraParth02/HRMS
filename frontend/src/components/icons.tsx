"use client";

import React, { ElementType } from "react";
import type { SvgIconProps } from "@mui/material";

// Material UI Icons
import Lock from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Email from "@mui/icons-material/Email";
import Dashboard from "@mui/icons-material/Dashboard";
import Group from "@mui/icons-material/Group";
import CalendarToday from "@mui/icons-material/CalendarToday";
import Payments from "@mui/icons-material/Payments";
import BarChart from "@mui/icons-material/BarChart";
import Logout from "@mui/icons-material/Logout";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Google from "@mui/icons-material/Google";
import Menu from "@mui/icons-material/Menu";
import Search from "@mui/icons-material/Search";
import Notifications from "@mui/icons-material/Notifications";
import Settings from "@mui/icons-material/Settings";
import Close from "@mui/icons-material/Close";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import Cancel from "@mui/icons-material/Cancel";
import AccessTime from "@mui/icons-material/AccessTime";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import Check from "@mui/icons-material/Check";
import InfoOutlined from "@mui/icons-material/InfoOutlined";

/**
 * Higher-Order Component (HOC) to scale all icons by 1.25em
 * so they scale responsively with text and Tailwind classes.
 */
export const withCustomSize = (
  Component: ElementType<SvgIconProps>
): React.FC<SvgIconProps> => {
  const WrappedIcon: React.FC<SvgIconProps> = ({ sx, className, ...rest }) => {
    return (
      <Component
        className={className}
        sx={{
          fontSize: "1.25em",
          ...sx,
        }}
        {...rest}
      />
    );
  };

  WrappedIcon.displayName = `WithCustomSize(Icon)`;
  return WrappedIcon;
};

// Auth & Common Icons
export const LockIcon: React.FC<SvgIconProps> = withCustomSize(Lock);
export const VisibilityIcon: React.FC<SvgIconProps> = withCustomSize(Visibility);
export const VisibilityOffIcon: React.FC<SvgIconProps> = withCustomSize(VisibilityOff);
export const EmailIcon: React.FC<SvgIconProps> = withCustomSize(Email);
export const ArrowForwardIcon: React.FC<SvgIconProps> = withCustomSize(ArrowForward);
export const CheckCircleIcon: React.FC<SvgIconProps> = withCustomSize(CheckCircle);
export const GoogleIcon: React.FC<SvgIconProps> = withCustomSize(Google);
export const InfoIcon: React.FC<SvgIconProps> = withCustomSize(InfoOutlined);
export const HelpOutlineIcon: React.FC<SvgIconProps> = withCustomSize(InfoOutlined);

// Navigation & Layout Icons
export const DashboardIcon: React.FC<SvgIconProps> = withCustomSize(Dashboard);
export const GroupIcon: React.FC<SvgIconProps> = withCustomSize(Group);
export const EmployeesIcon: React.FC<SvgIconProps> = withCustomSize(Group);
export const CalendarTodayIcon: React.FC<SvgIconProps> = withCustomSize(CalendarToday);
export const CalendarIcon: React.FC<SvgIconProps> = withCustomSize(CalendarToday);
export const AttendanceIcon: React.FC<SvgIconProps> = withCustomSize(CalendarToday);
export const PaymentsIcon: React.FC<SvgIconProps> = withCustomSize(Payments);
export const PayrollIcon: React.FC<SvgIconProps> = withCustomSize(Payments);
export const BarChartIcon: React.FC<SvgIconProps> = withCustomSize(BarChart);
export const ReportsIcon: React.FC<SvgIconProps> = withCustomSize(BarChart);
export const SettingsIcon: React.FC<SvgIconProps> = withCustomSize(Settings);
export const LogoutIcon: React.FC<SvgIconProps> = withCustomSize(Logout);
export const MenuIcon: React.FC<SvgIconProps> = withCustomSize(Menu);
export const SearchIcon: React.FC<SvgIconProps> = withCustomSize(Search);
export const NotificationsIcon: React.FC<SvgIconProps> = withCustomSize(Notifications);
export const CloseIcon: React.FC<SvgIconProps> = withCustomSize(Close);
export const ChevronDownIcon: React.FC<SvgIconProps> = withCustomSize(KeyboardArrowDown);

// Dashboard Metric & Status Icons
export const CancelIcon: React.FC<SvgIconProps> = withCustomSize(Cancel);
export const AccessTimeIcon: React.FC<SvgIconProps> = withCustomSize(AccessTime);
export const ReceiptLongIcon: React.FC<SvgIconProps> = withCustomSize(ReceiptLong);
export const CheckIcon: React.FC<SvgIconProps> = withCustomSize(Check);
