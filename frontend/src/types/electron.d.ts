export interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  getAppVersion: () => Promise<string>;
  isMaximized: () => Promise<boolean>;
  platform: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
