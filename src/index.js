const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const isDev = require("@kingdanx/electron-is-dev");
const LiteLogger = require("@kingdanx/litelogger");
const { spawn } = require("child_process");

const PYTHON = path.join(__dirname, "binaries", "python", "python.exe");
const EDGE_TTS = path.join(
  __dirname,
  "binaries",
  "python",
  "Scripts",
  "edge-tts.exe"
);

const logger = new LiteLogger(__dirname, "log", "logs", 14);

let window;
let voices = [];

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 525,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  window = mainWindow;

  // and load the index.html of the app.
  mainWindow.removeMenu();
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "index.html"));
  }

  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  initListeners();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
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
function getVoices() {
  const python = spawn(EDGE_TTS, ["-l"]);

  python.on("error", (e) =>
    window.webContents.send("getVoices", {
      success: false,
      error: e.toString(),
    })
  );

  python.stderr.on("data", (e) =>
    window.webContents.send("getVoices", {
      success: false,
      error: e.toString(),
    })
  );

  python.stdout.on("data", (d) => {
    const strData = d.toString();

    const splitData = strData.split("\r\n");

    const data = splitData
      .filter((voice) => voice.includes("Name"))
      .map((voice) => {
        const v = voice.replace("Name: ", "");
        return {
          voiceId: v,
          language: v.slice(0, 2).replace("-", "").toUpperCase(),
          accent: v.slice(3, 5).replace("-", ""),
          name: v.slice(6).replace("Neural", "").replace("-", ""),
        };
      });

    voices = data;

    window.webContents.send("getVoices", {
      success: true,
      data: voices,
    });
  });
}

function previewTts(text, voice) {
  const filePath = path.join(__dirname, "temp", `temp${Date.now()}.mp3`);
  const python = spawn(EDGE_TTS, [
    "-t",
    text,
    "--voice",
    voice,
    "--write-media",
    filePath,
  ]);

  python.on("error", (e) =>
    window.webContents.send("getVoices", {
      success: false,
      error: e.toString(),
    })
  );

  python.stderr.on("data", (e) =>
    window.webContents.send("getVoices", {
      success: false,
      error: e.toString(),
    })
  );

  python.stdout.on("data", (d) => console.log(d.toString()));

  python.on("close", () => {
    window.webContents.send("getVoices", {
      success: true,
      data: filePath,
    });
  });
}

function initListeners() {
  ipcMain.on("getVoices", getVoices);
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

// getVoices();
// previewTts();
