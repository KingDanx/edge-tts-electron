import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import fs from "fs";
import isDev from "electron-is-dev";
import LiteLogger from "@kingdanx/litelogger";
import install from "electron-squirrel-startup";
import EdgeTTS from "@kingdanx/edge-tts-js";
import { randomUUID } from "node:crypto";

const __dirname = import.meta.dirname;

const TEMP_PATH = getResourcePath(path.join("temp"));

const logger = new LiteLogger(getResourcePath(), "log", "logs", 14);

const tts = new EdgeTTS({});

let window;
let voices = [];

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (install) {
  app.quit();
}

process.on("uncaughtException", (error) => {
  console.error("Unhandled Exception:", error);
  dialog.showErrorBox(
    "Unhandled Exception",
    `An error occurred: ${error.message}`
  );
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 525,
    frame: false,
    webPreferences: {
      webSecurity: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  window = mainWindow;

  // and load the index.html of the app.
  mainWindow.removeMenu();
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile("src/frontend/dist/index.html");
  }

  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app
  .whenReady()
  .then(async () => {
    try {
      purgeTemp();
      voices = await EdgeTTS.getVoices();
      createWindow();
      initListeners();

      // On OS X it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow();
        }
      });
    } catch (e) {
      console.error(e);
    }
  })
  .catch((e) => {
    dialog.showErrorBox(
      "Unhandled Exception",
      `An error occurred: ${e?.message || e.toString()}`
    );
  });

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
function getResourcePath(resourceRelativePath = null) {
  if (isDev) {
    if (resourceRelativePath) {
      return path.join(__dirname, resourceRelativePath);
    } else {
      return __dirname;
    }
  }
  if (resourceRelativePath) {
    return path.join(process.resourcesPath, resourceRelativePath);
  } else {
    return process.resourcesPath;
  }
}

function getVoices() {
  window.webContents.send("getVoices", {
    success: true,
    data: voices,
  });
}

async function previewTts(event, { text, voiceId = "en-US-BrianNeural" }) {
  const filePath = getResourcePath(path.join("temp"));

  try {
    tts.tts.setVoiceParams({ voice: voiceId, text: text });

    const file = await tts.ttsToFile(filePath);

    const randomFileName = `${randomUUID()}${tts.tts.fileType.ext}`;

    const newPath = path.join(filePath, randomFileName);

    await fs.promises.rename(file, newPath);

    window.webContents.send("previewTts", {
      success: true,
      data: newPath,
    });
  } catch (error) {
    window.webContents.send("previewTts", {
      success: false,
      error: error.toString(),
    });
  }
}

async function purgeTemp() {
  try {
    const files = await fs.promises.readdir(TEMP_PATH);

    for (const file of files) {
      const filePath = path.join(TEMP_PATH, file);
      await fs.promises.unlink(filePath);
    }
  } catch (e) {
    logger.error(`Purge temp error: ${e.toString()}`);
  }
}

function initListeners() {
  ipcMain.on("getVoices", getVoices);
  ipcMain.on("previewTts", previewTts);
  ipcMain.on("minimize-window", () => {
    window.minimize();
  });
  ipcMain.on("maximize-window", () => {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  });
  ipcMain.on("close-window", () => {
    window.close();
  });
}
