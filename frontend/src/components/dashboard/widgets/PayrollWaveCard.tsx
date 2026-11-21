"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  PaymentsIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowForwardIcon,
} from "../../icons";
import { PayrollSummary, MonthlyPayrollPoint } from "../../../types/dashboard.types";

interface PayrollWaveCardProps {
  payroll: PayrollSummary;
}

export const PayrollWaveCard: React.FC<PayrollWaveCardProps> = ({ payroll }) => {
  const { totalDisbursed, payrollTrendPct, monthlyTrend } = payroll;

  const formattedAmount = useMemo(() => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(totalDisbursed);
  }, [totalDisbursed]);

  // Compute dynamic cubic Bezier spline for the 6-month historical trend
  const { strokePath, fillPath, points } = useMemo(() => {
    const dataPoints: MonthlyPayrollPoint[] =
      monthlyTrend.length >= 2
        ? monthlyTrend
        : [
            { month: "M-5", monthYear: "2026-06", amount: 0 },
            { month: "M-4", monthYear: "2026-07", amount: 0 },
            { month: "M-3", monthYear: "2026-08", amount: 0 },
            { month: "M-2", monthYear: "2026-09", amount: 0 },
            { month: "M-1", monthYear: "2026-10", amount: 0 },
            { month: "Now", monthYear: "2026-11", amount: totalDisbursed },
          ];

    const count = dataPoints.length;
    const amounts = dataPoints.map((d) => d.amount);
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const range = maxAmount - minAmount;

    const width = 300;
    const yTop = 18;
    const yBottom = 72;
    const yCanvasBottom = 90;

    // Map each data point to (x, y)
    const pts = dataPoints.map((dp, i) => {
      const x = Math.round(i * (width / (count - 1)));
      const normalized = range > 0 ? (dp.amount - minAmount) / range : 0.5;
      const y = Math.round(yBottom - normalized * (yBottom - yTop));
      return { x, y, month: dp.month, amount: dp.amount };
    });

    if (pts.length < 2) {
      return { strokePath: "", fillPath: "", points: [] };
    }

    // Build cubic Bezier curve through points
    let d = `M ${pts[0]?.x ?? 0},${pts[0]?.y ?? 45}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]!;
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;
      const p3 = pts[Math.min(pts.length - 1, i + 2)]!;

      // Catmull-Rom to Cubic Bezier control points
      const cp1x = Math.round(p1.x + (p2.x - p0.x) / 6);
      const cp1y = Math.round(p1.y + (p2.y - p0.y) / 6);
      const cp2x = Math.round(p2.x - (p3.x - p1.x) / 6);
      const cp2y = Math.round(p2.y - (p3.y - p1.y) / 6);

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    const stroke = d;
    const fill = `${d} L ${width},${yCanvasBottom} L 0,${yCanvasBottom} Z`;

    return { strokePath: stroke, fillPath: fill, points: pts };
  }, [monthlyTrend, totalDisbursed]);

  const isPositive = payrollTrendPct >= 0;
  const TrendIcon = isPositive ? TrendingUpIcon : TrendingDownIcon;
  const trendColor = isPositive ? "text-emerald-600" : "text-rose-600";
  const trendPrefix = isPositive ? "+" : "";

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-teal-50 shadow-2xs flex flex-col justify-between overflow-hidden relative">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <PaymentsIcon className="w-4 h-4" />
            </div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-800">
              Total Monthly Payroll
            </h2>
          </div>
          <Link
            href="/payroll"
            className="text-[11px] font-semibold text-teal-700 hover:underline inline-flex items-center gap-1"
          >
            <span>Run Payroll</span>
            <ArrowForwardIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {formattedAmount}
          </span>
          <span className={`text-[11px] font-bold inline-flex items-center gap-0.5 ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span>{trendPrefix}{payrollTrendPct}%</span>
          </span>
        </div>
      </div>

      {/* Dynamic 6-Month Bezier Wave SVG */}
      <div className="w-full mt-3 -mb-1">
        <div className="w-full h-16 sm:h-20">
          <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 300 90"
          >
            <defs>
              <linearGradient id="liveWaveFill" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {/* Gradient Fill under Curve */}
            {fillPath && (
              <path
                d={fillPath}
                fill="url(#liveWaveFill)"
                className="transition-all duration-700"
              />
            )}

            {/* Stroke Curve Line */}
            {strokePath && (
              <path
                d={strokePath}
                fill="none"
                stroke="#0d9488"
                strokeLinecap="round"
                strokeWidth="2.8"
                className="transition-all duration-700"
              />
            )}
          </svg>
        </div>

        {/* Month Labels Axis */}
        <div className="flex items-center justify-between text-[9px] font-semibold text-slate-400 px-1 pt-1 border-t border-slate-100/60">
          {points.map((pt) => (
            <span key={pt.month} title={`${pt.month}: ₹${pt.amount.toLocaleString()}`}>
              {pt.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
