"use client";

import React from "react";

export interface HighlightTextProps {
  text?: string | number | null;
  query?: string | null;
  className?: string;
  highlightClassName?: string;
}

/**
 * Escape special regex characters in a query string.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Reusable Dr.Ex HighlightText Component.
 * Highlights matching search query substrings in amber markup.
 */
export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  query,
  className = "",
  highlightClassName = "bg-amber-100 text-amber-900 font-semibold px-0.5 rounded",
}) => {
  if (text === null || text === undefined) {
    return null;
  }

  const strText = String(text);

  if (!query || !query.trim()) {
    return <span className={className}>{strText}</span>;
  }

  const cleanQuery = query.trim();
  const escaped = escapeRegExp(cleanQuery);
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = strText.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === cleanQuery.toLowerCase();
        return isMatch ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        );
      })}
    </span>
  );
};
