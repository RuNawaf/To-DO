import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "../shared/ipc";
import type { AppState, Task, Settings } from "../shared/types";

const api = {
  getState: (): Promise<AppState> => ipcRenderer.invoke(IPC.GET_STATE),
  setTasks: (tasks: Task[]): Promise<void> =>
    ipcRenderer.invoke(IPC.SET_TASKS, tasks),
  setSettings: (settings: Settings): Promise<void> =>
    ipcRenderer.invoke(IPC.SET_SETTINGS, settings),
  onStateChanged: (cb: (state: AppState) => void) => {
    const listener = (_: unknown, state: AppState) => cb(state);
    ipcRenderer.on(IPC.STATE_CHANGED, listener);
    return () => ipcRenderer.removeListener(IPC.STATE_CHANGED, listener);
  },
  minimize: () => ipcRenderer.send(IPC.WINDOW_MINIMIZE),
  close: () => ipcRenderer.send(IPC.WINDOW_CLOSE),
  setAlwaysOnTop: (value: boolean) =>
    ipcRenderer.send(IPC.WINDOW_SET_ALWAYS_ON_TOP, value),
  setIgnoreMouse: (ignore: boolean, forward?: boolean) =>
    ipcRenderer.send(IPC.WINDOW_SET_IGNORE_MOUSE, ignore, forward),
  toggleCompactSize: (compact: boolean) =>
    ipcRenderer.send(IPC.WINDOW_TOGGLE_COMPACT_SIZE, compact),
  openExternal: (url: string) => ipcRenderer.send(IPC.OPEN_EXTERNAL, url),
};

contextBridge.exposeInMainWorld("taskWidget", api);

export type TaskWidgetAPI = typeof api;
