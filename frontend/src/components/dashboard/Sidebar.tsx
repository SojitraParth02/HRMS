"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSidebarContext } from "../../context/SidebarContext";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { logout } from "../../store/slices/authSlice";
import { SidebarNavItem } from "../../types/sidebar.types";
import {
  DashboardIcon,
  EmployeesIcon,
  AttendanceIcon,
  LeavesIcon,
  PayrollIcon,
  ReportsIcon,
  SettingsIcon,
  LogoutIcon,
  CloseIcon,
} from "../icons";

const LOGO_URL: string =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA7JhzhO12D489BG0yaeK-Ax0J2ysuK6B0jQ5Cdzo82RZ2ed4onk-up_sSHv2w8KOI64BaQUgr2iLb5G_Je-x7rC2Zlwywvr8YqFTMLyyk6h_H4O-qqyOfZ823QY5NvhlhaaQO8tctCfKOxw8u4Wbrh_ZG5ITfh07xFfK7PGRhxW-R_xpiTx2lUbbcRt05EuwdnUmbzO3vLW__xH9W9wF0tKxYOy7TwpxVksuzCPTwtuWGG6cDULAXN";

const NAV_ITEMS: SidebarNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: ({ className }: { className?: string }): React.ReactNode => (
      <DashboardIcon className={className ?? "w-5 h-5 shrink-0"} />
    ),
  },
  {
    title: "Employees",
    href: "/employees",
    icon: ({ className }: { className?: string }): React.ReactNode => (
      <EmployeesIcon className={className ?? "w-5 h-5 shrink-0"} />
    ),
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: ({ className }: { className?: string }): React.ReactNode => (
      <AttendanceIcon className={className ?? "w-5 h-5 shrink-0"} />
    ),
  },
  {
    title: "Leaves",
    href: "/leaves",
    icon: ({ className }: { className?: string }): React.ReactNode => (
      <LeavesIcon className={className ?? "w-5 h-5 shrink-0"} />
    ),
  },
  {
    title: "Payroll",
    href: "/payroll",
    icon: ({ className }: { className?: string }): React.ReactNode => (
      <PayrollIcon className={className ?? "w-5 h-5 shrink-0"} />
    ),
  },
  {
    title: "Reports",
    href: "/reports",
    roles: ["ADMIN", "HR"],
    icon: ({ className }: { className?: string }): React.ReactNode => (
      <ReportsIcon className={className ?? "w-5 h-5 shrink-0"} />
    ),
  },
  {
    title: "Settings",
    href: "/settings",
    icon: ({ className }: { className?: string }): React.ReactNode => (
      <SettingsIcon className={className ?? "w-5 h-5 shrink-0"} />
    ),
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebarContext();
  const currentUser = useAppSelector((state) => state.auth.user);
  const userRole = currentUser?.role;

  const visibleNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      if (!item.roles) return true;
      return userRole ? item.roles.includes(userRole) : false;
    });
  }, [userRole]);

  const isItemActive = (href: string): boolean => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = (): void => {
    queryClient.clear();
    dispatch(logout());
    closeMobile();
    router.replace("/login");
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        id="mobile-backdrop"
        onClick={closeMobile}
        aria-hidden={!isMobileOpen}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ${isMobileOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
          }`}
      />

      {/* SIDEBAR ASIDE */}
      <aside
        id="sidebar"
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-[#e0f0ed] flex flex-col justify-between shrink-0 z-50 transition-all duration-300 ease-in-out no-scrollbar overflow-y-auto ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 ${isCollapsed ? "lg:w-20" : "lg:w-64"} w-64`}
      >
        <div className={isCollapsed ? "p-3 lg:p-3" : "p-6"}>
          {/* Logo Header & Mobile Close Button */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100">
            <div className="flex flex-col items-center justify-center w-full text-center">
              <div className="h-12 flex items-center justify-center mb-1">
                <Image
                  alt="HRMS Logo"
                  className="h-10 w-auto object-contain"
                  src={LOGO_URL}
                  width={140}
                  height={40}
                  priority
                  unoptimized
                />
              </div>
              {!isCollapsed && (
                <span className="text-[10px] font-bold tracking-tight text-slate-400 mt-0.5 uppercase">
                  Workforce Management
                </span>
              )}
            </div>
            <button
              id="close-sidebar-btn"
              type="button"
              onClick={closeMobile}
              className="lg:hidden p-1.5 -mr-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              aria-label="Close sidebar"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav aria-label="Sidebar Navigation" className="mt-5 space-y-1">
            {visibleNavItems.map((item: SidebarNavItem) => {
              const active: boolean = isItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={closeMobile}
                  title={isCollapsed ? item.title : undefined}
                  className={`flex items-center ${isCollapsed ? "lg:justify-center px-4 lg:px-2" : "gap-3.5 px-4"
                    } py-2.5 rounded-xl font-medium transition-colors text-sm ${active
                      ? "bg-[#008272] text-white shadow-sm shadow-teal-700/20"
                      : "text-slate-600 hover:text-[#008272] hover:bg-teal-50/60"
                    }`}
                >
                  {item.icon({
                    className: `w-5 h-5 shrink-0 ${active ? "text-white" : "text-slate-400"
                      }`,
                  })}
                  <span className={isCollapsed ? "lg:hidden" : ""}>
                    {item.title}
                  </span>
                </Link>
              );
            })}

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              title={isCollapsed ? "Logout" : undefined}
              className={`w-full flex items-center ${isCollapsed ? "lg:justify-center px-4 lg:px-2" : "gap-3.5 px-4"
                } py-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50/60 font-medium transition-colors text-sm cursor-pointer`}
            >
              <LogoutIcon className="w-5 h-5 shrink-0 text-slate-400 hover:text-rose-600" />
              <span className={isCollapsed ? "lg:hidden" : ""}>
                Logout
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Illustration & Copyright */}
        <div
          className={`relative overflow-hidden pt-2 shrink-0 ${isCollapsed ? "lg:hidden" : ""
            }`}
        >
          <div className="px-4 opacity-80">
            <svg
              className="w-full h-16 text-teal-200/70"
              fill="currentColor"
              viewBox="0 0 220 90"
            >
              <path d="M5 90 C 5 70, 20 60, 25 90 Z" fill="#bfeae4" />
              <path d="M-10 90 C -5 50, 15 55, 10 90 Z" fill="#9cdcd2" />
              <path d="M210 90 C 205 60, 225 65, 230 90 Z" fill="#9cdcd2" />
              <path d="M195 90 C 198 70, 212 70, 215 90 Z" fill="#bfeae4" />
              <circle cx="50" cy="50" fill="#75c9be" r="10" />
              <path d="M32 90 C 32 72, 40 66, 50 66 C 60 66, 68 72, 68 90 Z" fill="#75c9be" />
              <circle cx="85" cy="44" fill="#4ea99e" r="11" />
              <path d="M66 90 C 66 65, 75 58, 85 58 C 95 58, 104 65, 104 90 Z" fill="#4ea99e" />
              <circle cx="120" cy="48" fill="#67beaf" r="10" />
              <path d="M103 90 C 103 69, 111 63, 120 63 C 129 63, 137 69, 137 90 Z" fill="#67beaf" />
              <circle cx="152" cy="53" fill="#88d4ca" r="9" />
              <path d="M136 90 C 136 74, 144 69, 152 69 C 160 69, 168 74, 168 90 Z" fill="#88d4ca" />
            </svg>
          </div>
          <div className="px-6 py-3 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              © 2026 HRMS. All rights reserved.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
