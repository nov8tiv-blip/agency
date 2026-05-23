import { app, BrowserWindow, shell } from "electron";
import path from "path";

const isDev = !app.isPackaged;
const BACKEND_URL = isDev
  ? "http://localhost:3000"
  : (process.env.CRM_BACKEND_URL ?? "https://your-ec2-domain.com");

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true,
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL(BACKEND_URL);

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: false,
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
