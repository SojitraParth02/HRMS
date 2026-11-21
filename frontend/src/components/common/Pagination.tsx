"use client";

import React, { useMemo } from "react";
import { PaginationProps } from "../../types/pagination.types";

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  pageSize,
  totalRecords,
  totalPages,
  onPageChange,
  onPageSizeChange,
  itemName = "records",
  pageSizeOptions = [10, 25, 50],
  className = "",
}) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const startRecord =
    totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endRecord = Math.min(safeCurrentPage * pageSize, totalRecords);

  const pages = useMemo<(number | string)[]>(() => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", safeTotalPages];
    }

    if (safeCurrentPage >= safeTotalPages - 3) {
      return [
        1,
        "...",
        safeTotalPages - 4,
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages,
      ];
    }

    return [
      1,
      "...",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "...",
      safeTotalPages,
    ];
  }, [safeCurrentPage, safeTotalPages]);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-100 text-xs text-slate-500 font-medium select-none ${className}`}
    >
      {/* Left side: Showing X to Y of Z */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span>
          Showing{" "}
          <strong className="text-slate-700 font-bold">{startRecord}</strong> to{" "}
          <strong className="text-slate-700 font-bold">{endRecord}</strong> of{" "}
          <strong className="text-slate-700 font-bold">{totalRecords}</strong>{" "}
          {itemName}
        </span>

        {/* Rows per page selector */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="rows-per-page" className="hidden md:inline text-slate-400 text-[11px]">
            Rows:
          </label>
          <select
            id="rows-per-page"
            aria-label="Rows per page"
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2 py-1 transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-600"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right side: Page navigation */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          aria-label="Previous page"
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer text-sm font-bold"
        >
          ‹
        </button>

        {/* Page Number Buttons */}
        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="w-7 h-7 flex items-center justify-center text-slate-400 font-bold"
              >
                …
              </span>
            );
          }

          const pageNum = Number(p);
          const isActive = pageNum === safeCurrentPage;

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                isActive
                  ? "bg-[#008272] text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label="Next page"
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer text-sm font-bold"
        >
          ›
        </button>
      </div>
    </div>
  );
};

export default Pagination;
