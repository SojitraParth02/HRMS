/**
 * Standalone RFC-4180 Compliant CSV Export Utility.
 *
 * Features:
 * - Proper escaping of commas, double quotes, and newlines per RFC-4180.
 * - Prepends UTF-8 Byte Order Mark (\uFEFF) so Microsoft Excel opens Unicode and currency symbols (e.g. ₹) cleanly.
 * - Triggers instant, client-side browser download with memory leak prevention (URL.revokeObjectURL).
 */

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
}

/**
 * Escapes individual cell value according to RFC-4180 rules.
 */
export function escapeCsvField(
  val: string | number | boolean | null | undefined
): string {
  if (val === null || val === undefined) {
    return "";
  }
  const str = String(val);
  // If string contains comma, quote, or newline, escape quotes by doubling them and enclose in quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates and triggers browser download of an RFC-4180 compliant CSV file.
 *
 * @param filename Target download name (e.g. 'attendance_report_2026-11.csv')
 * @param columns Array of column header definitions and row accessors
 * @param data Array of records to export
 */
export function exportToCsv<T>(
  filename: string,
  columns: CsvColumn<T>[],
  data: T[]
): void {
  const headers = columns.map((col) => escapeCsvField(col.header)).join(",");
  const rows = data.map((row) =>
    columns.map((col) => escapeCsvField(col.accessor(row))).join(",")
  );

  // Prepend UTF-8 BOM (\uFEFF) so Excel respects UTF-8 (currency ₹, special characters)
  const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);

  const cleanName = filename.toLowerCase().endsWith(".csv")
    ? filename
    : `${filename}.csv`;

  link.setAttribute("download", cleanName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
