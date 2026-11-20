import { CompanySettingsModel, ICompanySettingsDocument } from "../models/settings.model";

export const seedDefaultCompanySettings = async (): Promise<ICompanySettingsDocument> => {
  const existingSettings = await CompanySettingsModel.findOne();
  if (existingSettings) {
    return existingSettings;
  }

  const defaultSettings = await CompanySettingsModel.create({
    shiftStartTime: "09:00",
    shiftEndTime: "18:00",
    graceWindowEndTime: "09:30",
    standardWorkHoursPerDay: 8,
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
    yearlyPaidLeaveQuota: 5,
    updatedBy: null,
  });

  console.log("[Settings] Initialized default Company Settings (09:00 - 18:00, Grace to 09:30, 5 Paid Leaves).");
  return defaultSettings;
};
