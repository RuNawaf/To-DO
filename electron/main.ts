import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  screen,
  shell,
  nativeImage,
} from "electron";
import path from "node:path";
import { IPC } from "../shared/ipc";
import { getState, getTasks, getSettings, setTasks, setSettings } from "./store";
import { startNotificationScheduler } from "./notificationScheduler";
import type { Settings, Task } from "../shared/types";

const isDev = process.env.NODE_ENV === "development";

const DEFAULT_WIDTH = 340;
const DEFAULT_HEIGHT = 480;
const COMPACT_WIDTH = 300;
const COMPACT_HEIGHT = 130;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let boundsSaveTimer: NodeJS.Timeout | null = null;

function resolveIcon(file: string) {
  return nativeImage.createFromPath(path.join(__dirname, "..", "..", "build", file));
}

function applyAutoLaunch(enabled: boolean) {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: false,
    });
  } catch {
    // Linux support for setLoginItemSettings is limited; ignore silently.
  }
}

function saveBoundsDebounced() {
  if (!mainWindow) return;
  if (boundsSaveTimer) clearTimeout(boundsSaveTimer);
  boundsSaveTimer = setTimeout(() => {
    if (!mainWindow) return;
    const bounds = mainWindow.getBounds();
    const settings = getSettings();
    setSettings({ ...settings, windowBounds: bounds });
  }, 400);
}

function broadcastState() {
  if (!mainWindow) return;
  mainWindow.webContents.send(IPC.STATE_CHANGED, getState());
}

function createWindow() {
  const settings = getSettings();
  const primary = screen.getPrimaryDisplay().workArea;
  const width = settings.windowBounds?.width ?? DEFAULT_WIDTH;
  const height = settings.windowBounds?.height ?? DEFAULT_HEIGHT;
  const x =
    settings.windowBounds?.x ??
    primary.x + primary.width - width - 24;
  const y = settings.windowBounds?.y ?? primary.y + 24;

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 260,
    minHeight: 110,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: true,
    resizable: true,
    alwaysOnTop: settings.alwaysOnTop,
    skipTaskbar: false,
    icon: resolveIcon("icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (settings.alwaysOnTop) {
    mainWindow.setAlwaysOnTop(true, "floating");
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "..", "dist", "index.html"));
  }

  mainWindow.on("move", saveBoundsDebounced);
  mainWindow.on("resize", saveBoundsDebounced);

  mainWindow.on("close", (event) => {
    if (!(app as any).isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.webContents.on("did-finish-load", broadcastState);
}

function createTray() {
  const icon = resolveIcon("tray-32.png");
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip("لوحة التزاماتي");

  const rebuildMenu = () => {
    const settings = getSettings();
    const menu = Menu.buildFromTemplate([
      {
        label: mainWindow?.isVisible() ? "إخفاء اللوحة" : "إظهار اللوحة",
        click: () => {
          if (!mainWindow) return;
          mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        },
      },
      {
        label: "تثبيت فوق النوافذ دائمًا",
        type: "checkbox",
        checked: settings.alwaysOnTop,
        click: (item) => {
          const s = getSettings();
          const updated = { ...s, alwaysOnTop: item.checked };
          setSettings(updated);
          mainWindow?.setAlwaysOnTop(item.checked, "floating");
          broadcastState();
        },
      },
      {
        label: "تشغيل تلقائي عند بدء الجهاز",
        type: "checkbox",
        checked: settings.autoStart,
        click: (item) => {
          const s = getSettings();
          const updated = { ...s, autoStart: item.checked };
          setSettings(updated);
          applyAutoLaunch(item.checked);
          broadcastState();
        },
      },
      { type: "separator" },
      {
        label: "إنهاء التطبيق",
        click: () => {
          (app as any).isQuitting = true;
          app.quit();
        },
      },
    ]);
    tray?.setContextMenu(menu);
  };

  rebuildMenu();
  tray.on("click", () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
    rebuildMenu();
  });
}

function registerIpcHandlers() {
  ipcMain.handle(IPC.GET_STATE, () => getState());

  ipcMain.handle(IPC.SET_TASKS, (_evt, tasks: Task[]) => {
    setTasks(tasks);
    broadcastState();
  });

  ipcMain.handle(IPC.SET_SETTINGS, (_evt, settings: Settings) => {
    const prev = getSettings();
    setSettings(settings);
    if (prev.alwaysOnTop !== settings.alwaysOnTop) {
      mainWindow?.setAlwaysOnTop(settings.alwaysOnTop, "floating");
    }
    if (prev.autoStart !== settings.autoStart) {
      applyAutoLaunch(settings.autoStart);
    }
    broadcastState();
  });

  ipcMain.on(IPC.WINDOW_MINIMIZE, () => mainWindow?.hide());
  ipcMain.on(IPC.WINDOW_CLOSE, () => mainWindow?.hide());

  ipcMain.on(IPC.WINDOW_SET_ALWAYS_ON_TOP, (_evt, value: boolean) => {
    mainWindow?.setAlwaysOnTop(value, "floating");
    const s = getSettings();
    setSettings({ ...s, alwaysOnTop: value });
  });

  ipcMain.on(IPC.WINDOW_SET_IGNORE_MOUSE, (_evt, ignore: boolean, forward?: boolean) => {
    mainWindow?.setIgnoreMouseEvents(ignore, { forward });
  });

  ipcMain.on(IPC.WINDOW_TOGGLE_COMPACT_SIZE, (_evt, compact: boolean) => {
    if (!mainWindow) return;
    const bounds = mainWindow.getBounds();
    const width = compact ? COMPACT_WIDTH : DEFAULT_WIDTH;
    const height = compact ? COMPACT_HEIGHT : DEFAULT_HEIGHT;
    mainWindow.setBounds({ x: bounds.x, y: bounds.y, width, height }, true);
  });

  ipcMain.on(IPC.OPEN_EXTERNAL, (_evt, url: string) => {
    shell.openExternal(url);
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();
    createTray();
    applyAutoLaunch(getSettings().autoStart);
    startNotificationScheduler(() => broadcastState());

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
      else mainWindow?.show();
    });
  });

  app.on("before-quit", () => {
    (app as any).isQuitting = true;
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      // Keep the app alive in the tray instead of quitting.
    }
  });
}
