/**
 * Sample Biometric CSV template content and browser download utility.
 * Header format strictly conforms to: Email,Date,PunchIn,PunchOut
 */

export const SAMPLE_BIOMETRIC_CSV_CONTENT = `Email,Date,PunchIn,PunchOut
jane.doe@hrms.com,2026-11-20,09:00,18:00
alex.smith@hrms.com,2026-11-20,09:18,18:20
rahul.sharma@hrms.com,2026-11-20,09:45,18:30
sarah.jenkins@hrms.com,2026-11-20,09:00,14:00
michael.brown@hrms.com,2026-11-20,09:00,
`;

export const downloadSampleBiometricCSV = (): void => {
  const blob = new Blob([SAMPLE_BIOMETRIC_CSV_CONTENT], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "sample_biometric_attendance.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
