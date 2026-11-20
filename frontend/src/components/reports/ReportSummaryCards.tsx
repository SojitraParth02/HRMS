"use client";

import React from "react";

export interface ReportSummaryItem {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: "teal" | "emerald" | "amber" | "rose" | "indigo";
}

interface ReportSummaryCardsProps {
  items: ReportSummaryItem[];
}

const variantStyles: Record<
  NonNullable<ReportSummaryItem["variant"]>,
  { bg: string; text: string; iconBg: string; border: string }
> = {
  teal: {
    bg: "bg-white",
    text: "text-teal-700",
    iconBg: "bg-teal-50 text-teal-700",
    border: "border-teal-100",
  },
  emerald: {
    bg: "bg-white",
    text: "text-emerald-700",
    iconBg: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-100",
  },
  amber: {
    bg: "bg-white",
    text: "text-amber-700",
    iconBg: "bg-amber-50 text-amber-700",
    border: "border-amber-100",
  },
  rose: {
    bg: "bg-white",
    text: "text-rose-700",
    iconBg: "bg-rose-50 text-rose-700",
    border: "border-rose-100",
  },
  indigo: {
    bg: "bg-white",
    text: "text-indigo-700",
    iconBg: "bg-indigo-50 text-indigo-700",
    border: "border-indigo-100",
  },
};

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({
  items,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, idx) => {
        const styles = variantStyles[item.variant || "teal"];
        return (
          <div
            key={idx}
            className={`${styles.bg} p-5 rounded-2xl border ${styles.border} shadow-2xs space-y-2 transition-all hover:shadow-xs`}
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {item.title}
              </span>
              <div
                className={`w-9 h-9 rounded-xl ${styles.iconBg} flex items-center justify-center shrink-0`}
              >
                {item.icon}
              </div>
            </div>
            <p className={`text-2xl font-black ${styles.text} tracking-tight font-mono`}>
              {item.value}
            </p>
            {item.subtitle && (
              <p className="text-[11px] text-slate-500 font-medium">
                {item.subtitle}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
