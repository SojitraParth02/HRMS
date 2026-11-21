import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";

// 1. Single-Instance Lock Enforcement
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow: BrowserWindow | null = null;

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

const isDev =
  process.env.ELECTRON_FORCE_PROD === "true"
    ? false
    : process.env.NODE_ENV === "development" || !app.isPackaged;

async function createWindow(): Promise<void> {
  const isMac = process.platform === "darwin";

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: "HRMS Enterprise Desktop",
    show: false, // Prevent white flash before content loads
    backgroundColor: "#ffffff",
    autoHideMenuBar: true,
    ...(isMac
      ? {
          titleBarStyle: "hiddenInset",
          trafficLightPosition: { x: 16, y: 16 },
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Display window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Open external links in user's default browser instead of Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (isDev) {
    const devUrl = process.env.ELECTRON_START_URL || "http://localhost:3000";
    try {
      await mainWindow.loadURL(devUrl);
    } catch {
      // If dev server hasn't finished booting, retry shortly
      setTimeout(() => {
        mainWindow?.loadURL(devUrl);
      }, 1500);
    }
  } else {
    // Production static serving from Next.js exported 'out' directory
    const { default: serve } = await import("electron-serve");
    const loadURL = serve({ directory: path.join(__dirname, "../out") });
    await loadURL(mainWindow);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// 2. Safe IPC Handlers for Window Controls & Info
ipcMain.on("window-minimize", () => {
  mainWindow?.minimize();
});

ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on("window-close", () => {
  mainWindow?.close();
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("is-maximized", () => {
  return mainWindow?.isMaximized() ?? false;
});

// 3. Application Lifecycle
app.whenReady().then(async () => {
  await createWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
