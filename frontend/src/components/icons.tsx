"use client";

import React, { ElementType } from "react";
import { SvgIconProps } from "@mui/material";
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

/**
 * Higher-Order Component (HOC) to scale all icons by 1.25em
 * so they scale responsively with text and Tailwind classes.
 */
export const withCustomSize = (
  Component: ElementType<SvgIconProps>
): React.FC<SvgIconProps> => {
  const WrappedIcon: React.FC<SvgIconProps> = ({ sx, ...rest }) => {
    return (
      <Component
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

export const LockIcon: React.FC<SvgIconProps> = withCustomSize(Lock);
export const VisibilityIcon: React.FC<SvgIconProps> = withCustomSize(Visibility);
export const VisibilityOffIcon: React.FC<SvgIconProps> = withCustomSize(VisibilityOff);
export const EmailIcon: React.FC<SvgIconProps> = withCustomSize(Email);
export const DashboardIcon: React.FC<SvgIconProps> = withCustomSize(Dashboard);
export const GroupIcon: React.FC<SvgIconProps> = withCustomSize(Group);
export const CalendarTodayIcon: React.FC<SvgIconProps> = withCustomSize(CalendarToday);
export const PaymentsIcon: React.FC<SvgIconProps> = withCustomSize(Payments);
export const BarChartIcon: React.FC<SvgIconProps> = withCustomSize(BarChart);
export const LogoutIcon: React.FC<SvgIconProps> = withCustomSize(Logout);
export const ArrowForwardIcon: React.FC<SvgIconProps> = withCustomSize(ArrowForward);
export const CheckCircleIcon: React.FC<SvgIconProps> = withCustomSize(CheckCircle);
export const GoogleIcon: React.FC<SvgIconProps> = withCustomSize(Google);
