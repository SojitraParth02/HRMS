"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSidebarContext } from "../../context/SidebarContext";
import { useSocket } from "../../context/SocketContext";
import { useAppSelector, useAppDispatch } from "../../hooks/redux";
import { logout } from "../../store/slices/authSlice";
import { User } from "../../types/auth.types";
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../../hooks/queries/useNotifications";
import { NotificationItem, NotificationType } from "../../types/notification.types";
import {
  MenuIcon,
  SearchIcon,
  NotificationsIcon,
  ChevronDownIcon,
  LogoutIcon,
  CalendarIcon,
  AccessTimeIcon,
  CheckCircleIcon,
  CancelIcon,
  PaymentsIcon,
  ReceiptLongIcon,
  CloseIcon,
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

const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return "";
  const now = Date.now();
  const past = new Date(dateString).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const renderNotificationIcon = (type: NotificationType): React.ReactNode => {
  switch (type) {
    case "LEAVE_APPROVED":
    case "CORRECTION_APPROVED":
    case "OVERTIME_APPROVED":
      return (
        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircleIcon className="w-4 h-4" />
        </div>
      );
    case "LEAVE_REJECTED":
    case "CORRECTION_REJECTED":
    case "OVERTIME_REJECTED":
      return (
        <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <CancelIcon className="w-4 h-4" />
        </div>
      );
    case "CORRECTION_REQUESTED":
    case "OVERTIME_REQUESTED":
      return (
        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <AccessTimeIcon className="w-4 h-4" />
        </div>
      );
    case "ADVANCE_LOGGED":
      return (
        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <PaymentsIcon className="w-4 h-4" />
        </div>
      );
    case "SALARY_DISBURSED":
      return (
        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
          <PaymentsIcon className="w-4 h-4" />
        </div>
      );
    case "PAYROLL_FINALIZED":
      return (
        <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
          <ReceiptLongIcon className="w-4 h-4" />
        </div>
      );
    case "LEAVE_APPLIED":
    default:
      return (
        <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
          <CalendarIcon className="w-4 h-4" />
        </div>
      );
  }
};

export const Topbar: React.FC = () => {
  const { toggleMobile } = useSidebarContext();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const queryClient = useQueryClient();

  const user: User | null = useAppSelector((state) => state.auth.user);

  const displayName: string = user?.username ?? "Parth Sojitra";
  const initials: string = getInitials(user?.username);
  const displayRole: string = formatRole(user?.role);
  const userEmail: string = user?.email ?? "admin@hrms.com";

  // Notifications State & Mutations
  const { data: notifData } = useNotificationsQuery(Boolean(user));
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);

  // Real-time socket toast state
  const { latestNotification } = useSocket();
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  // Desktop Electron Platform detection (for macOS traffic lights padding)
  const [isMacElectron, setIsMacElectron] = useState<boolean>(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI?.platform === "darwin") {
      setIsMacElectron(true);
    }
  }, []);

  useEffect(() => {
    if (latestNotification) {
      setActiveToast(latestNotification);
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [latestNotification]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount: number = notifData?.unreadCount ?? 0;
  const notifications: NotificationItem[] = notifData?.notifications ?? [];

  // Prefetch login route so logout transition is instantaneous
  useEffect(() => {
    router.prefetch("/login");
  }, [router]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = (): void => {
    setIsDropdownOpen(false);
    setIsNotifOpen(false);
    queryClient.clear();
    dispatch(logout());
    router.replace("/login");
  };

  const handleNotificationClick = (item: NotificationItem): void => {
    if (!item.isRead) {
      markReadMutation.mutate(item._id);
    }
    setIsNotifOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  return (
    <header
      className={`sticky top-0 z-30 bg-[#f4faf9]/85 backdrop-blur-md px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between border-b border-teal-100/50 transition-all ${
        isMacElectron ? "pl-20 sm:pl-20" : ""
      }`}
    >
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

      {/* Right Area: Real-Time Notifications & User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Persistent Real-Time Bell Icon & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            aria-label="Notifications"
            onClick={() => {
              setIsNotifOpen((prev) => !prev);
              setIsDropdownOpen(false);
            }}
            aria-expanded={isNotifOpen}
            className="relative p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100/60 rounded-xl transition cursor-pointer select-none"
            type="button"
          >
            <NotificationsIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in-50 duration-200">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
              role="dialog"
              aria-label="Notifications Panel"
            >
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 border border-teal-200/70 rounded-md text-[10px] font-semibold">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="text-[11px] font-medium text-teal-700 hover:text-teal-800 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <NotificationsIcon className="w-8 h-8 mx-auto mb-1.5 text-slate-300 opacity-60" />
                    <p className="text-xs font-medium">No notifications yet</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      You will be notified about attendance and leave events
                    </p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleNotificationClick(item)}
                      className={`px-4 py-3 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 text-left ${
                        !item.isRead ? "bg-teal-50/25" : ""
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {renderNotificationIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-xs truncate ${
                              !item.isRead
                                ? "font-bold text-slate-900"
                                : "font-semibold text-slate-700"
                            }`}
                          >
                            {item.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Container with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsDropdownOpen((prev) => !prev);
              setIsNotifOpen(false);
            }}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100/60 transition-colors cursor-pointer select-none focus:outline-none"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#008b8b] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-teal-100 select-none shrink-0">
              {initials}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-slate-800 hover:text-teal-700 transition-colors">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {displayRole}
              </span>
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 text-slate-400 hidden sm:block transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180 text-teal-700" : ""
              }`}
            />
          </button>

          {/* Profile & Logout Dropdown Menu */}
          {isDropdownOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              role="menu"
              aria-orientation="vertical"
            >
              {/* User Identity Header */}
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {userEmail}
                </p>
                <div className="mt-1.5">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-50 text-teal-700 border border-teal-200/60 uppercase">
                    {user?.role ?? "ADMIN"}
                  </span>
                </div>
              </div>

              {/* Action Items */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/80 hover:text-rose-700 transition-colors cursor-pointer text-left"
                  role="menuitem"
                >
                  <LogoutIcon className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Floating Notification Toast Alert */}
      {activeToast && (
        <div
          role="alert"
          onClick={() => {
            if (activeToast.link) {
              router.push(activeToast.link);
            }
            setActiveToast(null);
          }}
          className="fixed top-4 right-4 z-50 max-w-sm sm:max-w-md bg-white border border-teal-200/90 shadow-2xl rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer animate-in slide-in-from-top-4 duration-200 hover:shadow-teal-900/10 transition-all"
        >
          <div className="shrink-0 mt-0.5">
            {renderNotificationIcon(activeToast.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {activeToast.title}
              </h4>
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-full shrink-0">
                Just now
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-snug line-clamp-2">
              {activeToast.message}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close notification toast"
            onClick={(e) => {
              e.stopPropagation();
              setActiveToast(null);
            }}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition shrink-0"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
};

export default Topbar;
