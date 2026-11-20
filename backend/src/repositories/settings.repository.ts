import {
  CompanySettingsModel,
  ICompanySettings,
  ICompanySettingsDocument,
} from "../models/settings.model";
import { seedDefaultCompanySettings } from "../utils/seedSettings";

export class SettingsRepository {
  public async getSettings(): Promise<ICompanySettingsDocument> {
    const settings = await CompanySettingsModel.findOne().exec();
    if (settings) {
      return settings;
    }
    return await seedDefaultCompanySettings();
  }

  public async updateSettings(
    data: Partial<ICompanySettings>
  ): Promise<ICompanySettingsDocument | null> {
    return await CompanySettingsModel.findOneAndUpdate(
      {},
      { $set: data },
      { returnDocument: "after", runValidators: true }
    ).exec();
  }
}

export const settingsRepository = new SettingsRepository();
