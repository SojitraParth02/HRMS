"use client";

import React, { useState, useRef, useId } from "react";
import { useImportBiometricMutation } from "../../hooks/queries/useAttendance";
import { BiometricImportResult } from "../../types/attendance.types";
import { downloadSampleBiometricCSV } from "../../utils/sampleBiometricCSV";
import {
  CloseIcon,
  UploadFileIcon,
  DownloadIcon,
  CheckCircleIcon,
  WarningIcon,
  CancelIcon,
} from "../icons";

interface BiometricImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedPreviewRow {
  rowNumber: number;
  email: string;
  date: string;
  punchIn: string;
  punchOut: string;
  status: "VALID" | "DUPLICATE" | "INVALID";
  reason?: string;
}

export const BiometricImportModal: React.FC<BiometricImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedPreviewRow[]>([]);
  const [importResult, setImportResult] = useState<BiometricImportResult | null>(null);

  const importMutation = useImportBiometricMutation();

  if (!isOpen) return null;

  const resetState = () => {
    setSelectedFile(null);
    setParseError(null);
    setParsedRows([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseCSVClientSide = (file: File) => {
    setParseError(null);
    setImportResult(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || text.trim().length === 0) {
          setParseError("The selected CSV file is empty.");
          setParsedRows([]);
          return;
        }

        const rawLines = text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        if (rawLines.length === 0) {
          setParseError("The CSV file has no content.");
          setParsedRows([]);
          return;
        }

        const headerLine = rawLines[0];
        const headers = headerLine
          .split(",")
          .map((h) => h.trim().replace(/^["']|["']$/g, ""));

        const isHeaderValid =
          headers.length >= 4 &&
          headers[0].toLowerCase() === "email" &&
          headers[1].toLowerCase() === "date" &&
          headers[2].toLowerCase() === "punchin" &&
          headers[3].toLowerCase() === "punchout";

        if (!isHeaderValid) {
          setParseError(
            `Invalid CSV header format. Expected: Email,Date,PunchIn,PunchOut (Found: ${headers.join(",")})`
          );
          setParsedRows([]);
          return;
        }

        const dataLines = rawLines.slice(1);
        if (dataLines.length === 0) {
          setParseError("CSV contains headers but no employee attendance rows.");
          setParsedRows([]);
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

        const seenKeys = new Set<string>();
        const rows: ParsedPreviewRow[] = [];

        for (let i = 0; i < dataLines.length; i++) {
          const rowNumber = i + 2;
          const cols = dataLines[i]
            .split(",")
            .map((c) => c.trim().replace(/^["']|["']$/g, ""));

          const email = cols[0] || "";
          const date = cols[1] || "";
          const punchIn = cols[2] || "";
          const punchOut = cols[3] || "";

          let status: "VALID" | "DUPLICATE" | "INVALID" = "VALID";
          let reason: string | undefined = undefined;

          if (!email || !emailRegex.test(email)) {
            status = "INVALID";
            reason = "Invalid email format";
          } else if (!date || !dateRegex.test(date)) {
            status = "INVALID";
            reason = "Invalid date format (must be YYYY-MM-DD)";
          } else if (!punchIn || !timeRegex.test(punchIn)) {
            status = "INVALID";
            reason = "Invalid PunchIn time (must be HH:mm)";
          } else if (punchOut && !timeRegex.test(punchOut)) {
            status = "INVALID";
            reason = "Invalid PunchOut time (must be HH:mm)";
          } else {
            const key = `${email.toLowerCase()}_${date}`;
            if (seenKeys.has(key)) {
              status = "DUPLICATE";
              reason = "Duplicate record for same employee on date";
            } else {
              seenKeys.add(key);
            }
          }

          rows.push({
            rowNumber,
            email,
            date,
            punchIn,
            punchOut,
            status,
            reason,
          });
        }

        setParsedRows(rows);
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to parse CSV file.";
        setParseError(`Failed to parse CSV: ${errorMsg}`);
        setParsedRows([]);
      }
    };

    reader.onerror = () => {
      setParseError("Could not read the selected file. Please try again.");
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setParseError("Please select a valid .csv file.");
        return;
      }
      setSelectedFile(file);
      parseCSVClientSide(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setParseError("Please drop a valid .csv file.");
        return;
      }
      setSelectedFile(file);
      parseCSVClientSide(file);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;
    try {
      const result = await importMutation.mutateAsync(selectedFile);
      setImportResult(result);
    } catch {
      // Error is handled by TanStack mutation and error toast
    }
  };

  const validRowsCount = parsedRows.filter((r) => r.status === "VALID").length;
  const duplicateRowsCount = parsedRows.filter((r) => r.status === "DUPLICATE").length;
  const invalidRowsCount = parsedRows.filter((r) => r.status === "INVALID").length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <UploadFileIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Import Biometric CSV Attendance
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Upload raw punches from biometric clocks (eSSL, ZKTeco, Matrix)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Post-Import Result View */}
          {importResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-emerald-900">
                    Import Processed Successfully
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Processed {importResult.totalRows} records from{" "}
                    <strong>{importResult.fileName}</strong>. {importResult.successfulRows}{" "}
                    attendance records were inserted or updated.
                  </p>
                </div>
              </div>

              {importResult.errorLog.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <WarningIcon className="w-4 h-4 text-amber-600" />
                    <span>
                      Skipped / Flagged Rows ({importResult.errorLog.length})
                    </span>
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Row</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importResult.errorLog.map((err, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-mono font-bold text-slate-600">
                              #{err.row}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-700">
                              {err.email || "--"}
                            </td>
                            <td className="py-2 px-3 text-rose-600 font-medium">
                              {err.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetState}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Upload Another File
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Dropzone & Template Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800">
                    Template Format Required:
                  </span>
                  <p className="text-[11px] font-mono text-slate-500">
                    Email,Date,PunchIn,PunchOut
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleBiometricCSV}
                  className="px-3 py-1.5 bg-white hover:bg-teal-50 border border-teal-200 text-teal-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Upload Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition cursor-pointer select-none flex flex-col items-center justify-center gap-3 ${
                  isDragOver
                    ? "border-teal-600 bg-teal-50/50"
                    : selectedFile
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-slate-300 hover:border-teal-500 hover:bg-slate-50/50"
                }`}
              >
                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    selectedFile
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-teal-50 text-teal-600"
                  }`}
                >
                  <UploadFileIcon className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    {selectedFile ? (
                      <span className="text-emerald-700 font-mono">
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    ) : (
                      <>
                        <span className="text-teal-700 underline">
                          Click to browse
                        </span>{" "}
                        or drag and drop your CSV file here
                      </>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports comma-separated .csv files up to 5 MB
                  </p>
                </div>
              </div>

              {/* Error Banner */}
              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CancelIcon className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Interactive Preview Section */}
              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Total Rows
                      </span>
                      <p className="text-sm font-black text-slate-800 mt-0.5 font-mono">
                        {parsedRows.length}
                      </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">
                        Valid Records
                      </span>
                      <p className="text-sm font-black text-emerald-800 mt-0.5 font-mono">
                        {validRowsCount}
                      </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl">
                      <span className="text-[10px] font-bold text-amber-600 uppercase">
                        Duplicates
                      </span>
                      <p className="text-sm font-black text-amber-800 mt-0.5 font-mono">
                        {duplicateRowsCount}
                      </p>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                      <span className="text-[10px] font-bold text-rose-600 uppercase">
                        Invalid Rows
                      </span>
                      <p className="text-sm font-black text-rose-800 mt-0.5 font-mono">
                        {invalidRowsCount}
                      </p>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-200 z-10">
                          <tr>
                            <th className="py-2 px-3">#</th>
                            <th className="py-2 px-3">Email</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Punch In</th>
                            <th className="py-2 px-3">Punch Out</th>
                            <th className="py-2 px-3">Preview Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {parsedRows.map((row) => (
                            <tr
                              key={row.rowNumber}
                              className={`hover:bg-slate-50/60 ${
                                row.status === "INVALID"
                                  ? "bg-rose-50/30"
                                  : row.status === "DUPLICATE"
                                  ? "bg-amber-50/20"
                                  : ""
                              }`}
                            >
                              <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">
                                {row.rowNumber}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-800 text-[11px]">
                                {row.email || "--"}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-700 text-[11px]">
                                {row.date || "--"}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-700 text-[11px]">
                                {row.punchIn || "--"}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-700 text-[11px]">
                                {row.punchOut || "--"}
                              </td>
                              <td className="py-2 px-3">
                                {row.status === "VALID" ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                                    Valid
                                  </span>
                                ) : row.status === "DUPLICATE" ? (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                                    title={row.reason}
                                  >
                                    <WarningIcon className="w-3 h-3 text-amber-600" />
                                    Duplicate
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                                    title={row.reason}
                                  >
                                    <CancelIcon className="w-3 h-3 text-rose-600" />
                                    {row.reason || "Invalid"}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={
                    !selectedFile ||
                    parsedRows.length === 0 ||
                    validRowsCount === 0 ||
                    importMutation.isPending
                  }
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {importMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <UploadFileIcon className="w-4 h-4" />
                      <span>
                        Confirm &amp; Import ({validRowsCount} Records)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
