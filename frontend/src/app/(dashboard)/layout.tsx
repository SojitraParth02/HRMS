"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "../../context/SidebarContext";
import { Sidebar } from "../../components/dashboard/Sidebar";
import { Topbar } from "../../components/dashboard/Topbar";
import { useAppSelector } from "../../hooks/redux";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    const storedToken: string | null =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!isAuthenticated && !storedToken && !token) {
      router.replace("/login");
    } else {
      setIsMounted(true);
    }
  }, [isAuthenticated, token, router]);

  if (!isMounted) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#f0f8f7]"
        suppressHydrationWarning
      >
        <div className="flex flex-col items-center gap-3" suppressHydrationWarning>
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"
            suppressHydrationWarning
          />
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            Verifying session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#f0f8f7]" suppressHydrationWarning>
        <Sidebar />
        <div
          className="flex-1 flex flex-col min-w-0 bg-[#f4faf9] relative"
          suppressHydrationWarning
        >
          <Topbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
