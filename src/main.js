const path = require("path");
const fs = require("fs");
const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, screen } = require("electron");

let mainWindow;
let tray;
let isQuitting = false;

const WINDOW_WIDTH = 220;
const WINDOW_HEIGHT = 250;

app.disableHardwareAcceleration();

function settingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath(), "utf8"));
  } catch {
    return {};
  }
}

function writeSettings(settings) {
  fs.mkdirSync(app.getPath("userData"), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2));
}

function getInitialBounds() {
  const saved = readSettings().bounds;
  if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    return { x: saved.x, y: saved.y, width: WINDOW_WIDTH, height: WINDOW_HEIGHT };
  }

  const area = screen.getPrimaryDisplay().workArea;
  return {
    x: Math.round(area.x + area.width - WINDOW_WIDTH - 48),
    y: Math.round(area.y + area.height - WINDOW_HEIGHT - 48),
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    ...getInitialBounds(),
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, "floating");
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.on("moved", () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    writeSettings({ ...readSettings(), bounds: { x, y } });
  });

  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    mainWindow.hide();
  });
}

function createTray() {
  const atlas = nativeImage.createFromPath(path.join(__dirname, "..", "assets", "butter-dog-spritesheet.webp"));
  const icon = atlas.isEmpty()
    ? nativeImage.createEmpty()
    : atlas.crop({ x: 0, y: 0, width: 192, height: 208 }).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip("Butter Dog");
  tray.setContextMenu(buildMenu());
  tray.on("click", () => {
    if (!mainWindow) return;
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

function buildMenu() {
  return Menu.buildFromTemplate([
    {
      label: "显示 / 隐藏",
      click: () => {
        if (!mainWindow) return;
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
      }
    },
    {
      label: "置顶",
      type: "checkbox",
      checked: mainWindow ? mainWindow.isAlwaysOnTop() : true,
      click: (item) => {
        if (!mainWindow) return;
        mainWindow.setAlwaysOnTop(item.checked, "floating");
      }
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
}

ipcMain.handle("show-context-menu", () => {
  buildMenu().popup({ window: mainWindow });
});

ipcMain.on("move-window-by", (_event, delta) => {
  if (!mainWindow || !delta) return;
  const [x, y] = mainWindow.getPosition();
  const dx = Number.isFinite(delta.x) ? delta.x : 0;
  const dy = Number.isFinite(delta.y) ? delta.y : 0;
  mainWindow.setPosition(Math.round(x + dx), Math.round(y + dy));
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  isQuitting = true;
});

app.on("window-all-closed", (event) => {
  event.preventDefault();
});
