const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

let mainWindow;
let currentPetScale = 1;

const BASE_WINDOW_SIZE = {
  width: 260,
  height: 300
};

const PET_SIZES = [
  { label: '小', scale: 0.85 },
  { label: '标准', scale: 1 },
  { label: '大', scale: 1.25 },
  { label: '特大', scale: 1.5 }
];

function createWindow() {
  currentPetScale = readConfig().scale;
  const initialSize = windowSizeForScale(currentPetScale);

  mainWindow = new BrowserWindow({
    width: initialSize.width,
    height: initialSize.height,
    minWidth: 200,
    minHeight: 230,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'renderer.html'));
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.send('pet-scale-changed', currentPetScale);
  });

  mainWindow.webContents.on('context-menu', (_event, params) => {
    buildPetMenu().popup({
      window: mainWindow,
      x: params.x,
      y: params.y,
      sourceType: params.menuSourceType
    });
  });
}

function buildPetMenu() {
  const extensionItems = [
    {
      label: '调整大小',
      submenu: PET_SIZES.map((size) => ({
        label: size.label,
        type: 'radio',
        checked: Math.abs(currentPetScale - size.scale) < 0.001,
        click: () => setPetScale(size.scale)
      }))
    }
  ];

  return Menu.buildFromTemplate([
    {
      label: '打开回收站',
      click: () => openTrashLocation()
    },
    ...extensionItems,
    { type: 'separator' },
    {
      label: '退出黄油小狗',
      click: () => app.quit()
    }
  ]);
}

function configPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function readConfig() {
  try {
    const raw = fs.readFileSync(configPath(), 'utf8');
    const config = JSON.parse(raw);
    const scale = normalizePetScale(config.scale);
    return { scale };
  } catch (_error) {
    return { scale: 1 };
  }
}

function writeConfig(config) {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(configPath(), `${JSON.stringify(config, null, 2)}\n`);
}

function normalizePetScale(scale) {
  const numericScale = Number(scale);
  const supported = PET_SIZES.find((size) => Math.abs(size.scale - numericScale) < 0.001);
  return supported ? supported.scale : 1;
}

function windowSizeForScale(scale) {
  return {
    width: Math.round(BASE_WINDOW_SIZE.width * scale),
    height: Math.round(BASE_WINDOW_SIZE.height * scale)
  };
}

function setPetScale(scale, options = {}) {
  const normalizedScale = normalizePetScale(scale);
  currentPetScale = normalizedScale;

  if (options.persist !== false) {
    writeConfig({ scale: normalizedScale });
  }

  if (mainWindow && options.resize !== false) {
    const bounds = mainWindow.getBounds();
    const size = windowSizeForScale(normalizedScale);

    mainWindow.setBounds({
      x: Math.round(bounds.x + (bounds.width - size.width) / 2),
      y: Math.round(bounds.y + bounds.height - size.height),
      width: size.width,
      height: size.height
    });
  }

  if (mainWindow) {
    mainWindow.webContents.send('pet-scale-changed', normalizedScale);
  }
}

async function openTrashLocation() {
  if (process.platform === 'win32') {
    spawn('explorer.exe', ['shell:RecycleBinFolder'], {
      detached: true,
      stdio: 'ignore'
    }).unref();
    return;
  }

  if (process.platform === 'darwin') {
    await shell.openPath(path.join(os.homedir(), '.Trash'));
    return;
  }

  await shell.openExternal('trash:///');
}

async function trashFiles(filePaths) {
  const results = [];

  for (const filePath of filePaths) {
    const resolvedPath = path.resolve(filePath);

    try {
      if (!fs.existsSync(resolvedPath)) {
        throw new Error('文件不存在或已被移动');
      }

      await shell.trashItem(resolvedPath);
      results.push({ path: resolvedPath, ok: true });
    } catch (error) {
      results.push({
        path: resolvedPath,
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return {
    ok: results.every((result) => result.ok),
    results
  };
}

ipcMain.handle('trash-files', (_event, filePaths) => {
  if (!Array.isArray(filePaths)) {
    return { ok: false, results: [], error: '拖入内容格式不正确' };
  }

  return trashFiles(filePaths.filter(Boolean));
});

ipcMain.handle('open-trash', () => openTrashLocation());
ipcMain.handle('get-pet-scale', () => currentPetScale);

ipcMain.on('move-window', (_event, bounds) => {
  if (!mainWindow || !bounds) {
    return;
  }

  mainWindow.setBounds({
    x: Math.round(bounds.x),
    y: Math.round(bounds.y),
    width: mainWindow.getBounds().width,
    height: mainWindow.getBounds().height
  });
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

module.exports = {
  buildPetMenu,
  openTrashLocation,
  setPetScale,
  trashFiles
};
