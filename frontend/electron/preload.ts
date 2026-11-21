import { contextBridge, ipcRenderer } from "electron";

export interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  getAppVersion: () => Promise<string>;
  isMaximized: () => Promise<boolean>;
  platform: string;
}

const electronAPI: ElectronAPI = {
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  isMaximized: () => ipcRenderer.invoke("is-maximized"),
  platform: process.platform,
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);

