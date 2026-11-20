"use client";

import React from "react";
import DashboardLayout from "../dashboard/layout";
import { ReportsView } from "../../components/reports/ReportsView";
import { useAppSelector } from "../../hooks/redux";
import { WarningIcon } from "../../components/icons";

export default function ReportsPage() {
  const currentUser = useAppSelector((state) => state.auth.user);
  const isPrivileged =
    currentUser?.role === "ADMIN" || currentUser?.role === "HR";

  return (
    <DashboardLayout>
      {isPrivileged ? (
        <ReportsView />
      ) : (
        <div className="px-4 sm:px-8 py-12 flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <WarningIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-800">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-500 max-w-sm">
              Workforce reports and executive analytics are only accessible by Authorized HR and System Administrators.
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
