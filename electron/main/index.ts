import { app, BrowserWindow, shell, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { getAudioDuration } from "../utils";
import path from "node:path";
import os from "node:os";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

async function createWindow() {
  win = new BrowserWindow({
    title: "Main window",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

/**
 *  Progress: {
 *   frames: NaN,
 *   currentFps: NaN,
 *   currentKbps: 1536.2,
 *   targetSize: 756,
 *   timemark: '00:00:04.03'
 * }
 */
// 设置 IPC 监听器
ipcMain.handle("convert-audio", async (event, file) => {
  console.log("index.ts->141", file);
  const { outputFormat, filePath } = file;
  return new Promise(async (resolve, reject) => {
    try {
      file.status = 'formating';
      const dir = path.dirname(filePath);
      const baseName = path.basename(filePath, path.extname(filePath));
      const outputFilePath = path.join(dir, `${baseName}.${outputFormat}`);
      const fpg = ffmpeg(filePath);
      const duration = await getAudioDuration(filePath, fpg);
      console.log("index.ts->146", duration);
      fpg
        .output(outputFilePath)
        .toFormat(outputFormat)
        .on("progress", (progress) => {
          console.log(`Progress: ${progress.percent}% done`);
          console.log(`Frames: ${progress.frames}`);
          console.log(`Current FPS: ${progress.currentFps}`);
          console.log(`Current Kbps: ${progress.currentKbps}`);
          console.log(`Target Size: ${progress.targetSize}`);
          console.log(`Timemark: ${progress.timemark}`);
          file.percent = progress.percent;
          event.sender.send("conversion-progress", file);
        })
        .on("end", () => {
          console.log("Conversion successful!");
          file.status = '';
          resolve("Conversion successful!");
        })
        .on("error", (err, stdout, stderr) => {
          console.error("Error during conversion:", err, stdout, stderr);
          reject(`Error: ${stderr}`);
        })
        .run();
    } catch (err) {
      reject(`Unexpected error: ${err.message || err}`);
    }
  });
});
