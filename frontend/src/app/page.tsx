"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../hooks/redux";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const storedToken: string | null =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const hasAuth = isAuthenticated || Boolean(storedToken) || Boolean(token);
    const target = hasAuth ? "/dashboard/" : "/login/";

    if (typeof window !== "undefined" && window.location.protocol === "app:") {
      window.location.replace(target);
      return;
    }

    router.replace(target);
  }, [isAuthenticated, token, router]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#effaf8]"
      suppressHydrationWarning
    >
      <div className="flex flex-col items-center gap-3" suppressHydrationWarning>
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent"
          suppressHydrationWarning
        />
        <p className="text-sm font-medium text-slate-600">Redirecting to HRMS...</p>
      </div>
    </div>
  );
}
