const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("fs");
const isDev = require("@kingdanx/electron-is-dev");
const LiteLogger = require("@kingdanx/litelogger");
const { spawn } = require("child_process");

const PYTHON = getResourcePath(path.join("binaries", "python", "python.exe"));
const EDGE_TTS = getResourcePath(
  path.join("binaries", "python", "Scripts", "edge-tts.exe")
);
const PIP = getResourcePath(
  path.join("binaries", "python", "Scripts", "pip.exe")
);
const TEMP_PATH = getResourcePath(path.join("temp"));

const logger = new LiteLogger(getResourcePath(), "log", "logs", 14);

let window;
let voices = [];

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
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
  .then(() => {
    purgeTemp();
    installEdgeTts()
      .then((code) => {
        if (code == 0) {
          createWindow();
          initListeners();

          // On OS X it's common to re-create a window in the app when the
          // dock icon is clicked and there are no other windows open.
          app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) {
              createWindow();
            }
          });
        } else {
          throw new Error(
            "An error occured when uninstalling or installing edge-tts"
          );
        }
      })
      .catch((e) => {
        dialog.showErrorBox(
          "Unhandled Exception",
          `An error occurred: ${e?.message || e.toString()}`
        );
      });
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
  const python = spawn(EDGE_TTS, ["-l"]);

  python.on("error", (e) => {
    logger.error(`Get voices error: ${e.toString()}`);
    window.webContents.send("getVoices", {
      success: false,
      error: e.toString(),
    });
  });

  python.stderr.on("data", (e) => {
    logger.error(`Get voices error: ${e.toString()}`);
    window.webContents.send("getVoices", {
      success: false,
      error: e.toString(),
    });
  });

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

    python.kill(0);
  });
}

function previewTts(event, { text, voiceId = "en-US-BrianNeural" }) {
  const filePath = getResourcePath(path.join("temp", `temp${Date.now()}.mp3`));
  const python = spawn(EDGE_TTS, [
    "-t",
    `"${text.replaceAll('"', "''")}"`,
    "--voice",
    voiceId,
    "--write-media",
    filePath,
  ]);

  python.on("error", (e) => {
    if (!e.toString().includes("-->")) {
      window.webContents.send("previewTts", {
        success: false,
        error: e.toString(),
      });
      logger.error(`Preview error: ${e.toString()}`);
    }
  });

  python.stderr.on("data", (e) => {
    if (!e.toString().includes("-->")) {
      window.webContents.send("previewTts", {
        success: false,
        error: e.toString(),
      });
      logger.error(`Preview error: ${e.toString()}`);
    }
  });

  python.on("close", () => {
    window.webContents.send("previewTts", {
      success: true,
      data: filePath,
    });
  });
}

function installEdgeTts() {
  return new Promise((resolve, reject) => {
    const uninstall = spawn(PYTHON, [PIP, "uninstall", "edge-tts"]);

    uninstall.on("error", (e) => {
      logger.error(
        `An unexpected error occured while uninstalling edge-tts: ${e.toString()}`
      );
      if (!e.toString().includes("PATH")) {
        reject(e.toString());
      }
    });

    uninstall.stderr.on("data", (e) => {
      logger.error(`Uninstall error: ${e.toString()}`);
      if (!e.toString().includes("PATH")) {
        reject(e.toString());
      }
    });

    uninstall.stdout.on("data", (d) => {
      if (d.toString().includes("Y/n")) {
        uninstall.stdin.write(Buffer.from("y\r\n"), (e) => {
          if (e) {
            logger.error(`Write error: ${e.toString()}`);
          }
        });
      }
    });

    uninstall.on("close", () => {
      const install = spawn(PYTHON, [PIP, "install", "edge-tts"]);

      install.on("error", (e) => {
        logger.error(
          `An unexpected error occured while installing edge-tts: ${e.toString()}`
        );
        if (!e.toString().includes("PATH")) {
          reject(e.toString());
        }
      });

      install.stderr.on("data", (e) => {
        logger.error(`Install error: ${e.toString()}`);
        if (!e.toString().includes("PATH")) {
          reject(e.toString());
        }
      });

      install.stdout.on("data", (d) => {
        if (d.toString().includes("Y/n")) {
          install.stdin.write(Buffer.from("y\r\n"), (e) => {
            if (e) {
              logger.error(`Write error: ${e.toString()}`);
            }
          });
        }
      });

      install.on("close", (code) => {
        resolve(code);
      });
    });
  });
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
