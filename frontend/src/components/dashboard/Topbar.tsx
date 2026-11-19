"use client";

import React from "react";
import { useSidebarContext } from "../../context/SidebarContext";
import { useAppSelector } from "../../hooks/redux";
import { User } from "../../types/auth.types";
import {
  MenuIcon,
  SearchIcon,
  NotificationsIcon,
  ChevronDownIcon,
} from "../icons";

const getInitials = (name?: string | null): string => {
  if (!name) return "PK";
  const trimmed: string = name.trim();
  const parts: string[] = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return trimmed.substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatRole = (role?: string | null): string => {
  if (!role) return "Admin";
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

export const Topbar: React.FC = () => {
  const { toggleMobile } = useSidebarContext();
  const user: User | null = useAppSelector((state) => state.auth.user);

  const displayName: string = user?.username ?? "Parth Sojitra";
  const initials: string = getInitials(user?.username);
  const displayRole: string = formatRole(user?.role);

  return (
    <header className="sticky top-0 z-30 bg-[#f4faf9]/85 backdrop-blur-md px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between border-b border-teal-100/50">
      {/* Left Area: Mobile Hamburger & Search Input */}
      <div className="flex items-center gap-3 sm:gap-5 flex-1 max-w-xl">
        <button
          id="hamburger-btn"
          aria-label="Toggle Menu"
          onClick={toggleMobile}
          className="lg:hidden p-2 -ml-2 text-slate-700 hover:text-teal-700 rounded-lg transition-colors cursor-pointer"
          type="button"
        >
          <MenuIcon className="w-6 h-6" />
        </button>

        <div className="relative w-full max-w-xs sm:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-white/90 border border-slate-200/90 rounded-full text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008272] transition-all shadow-2xs text-slate-800"
            placeholder="Search employees, reports..."
            type="text"
          />
        </div>
      </div>

      {/* Right Area: Notifications & User Profile */}
      <div className="flex items-center gap-3 sm:gap-5">
        <button
          aria-label="Notifications"
          className="relative p-2 text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          type="button"
        >
          <NotificationsIcon className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white">
            2
          </span>
        </button>

        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#008b8b] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-teal-100 select-none">
            {initials}
          </div>
          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
              {displayName}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {displayRole}
            </span>
          </div>
          <ChevronDownIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 hidden sm:block transition-transform duration-200" />
        </div>
      </div>
    </header>
  );
};

export default Topbar;
