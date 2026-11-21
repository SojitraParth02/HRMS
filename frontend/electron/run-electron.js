/**
 * Cross-platform runner for launching Electron during local development.
 * Automatically clears ELECTRON_RUN_AS_NODE (often injected by IDE terminals)
 * to ensure Electron launches in full GUI application mode.
 */
delete process.env.ELECTRON_RUN_AS_NODE;
const electron = require("electron");
const { spawn } = require("child_process");

const child = spawn(electron, ["."], {
  stdio: "inherit",
  windowsHide: false,
  env: process.env,
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (err) => {
  console.error("Failed to launch Electron:", err);
  process.exit(1);
});

