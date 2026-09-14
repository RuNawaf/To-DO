/// <reference types="vite/client" />
import type { AppState, Task, Settings } from "../shared/types";

export interface TaskWidgetAPI {
  getState: () => Promise<AppState>;
  setTasks: (tasks: Task[]) => Promise<void>;
  setSettings: (settings: Settings) => Promise<void>;
  onStateChanged: (cb: (state: AppState) => void) => () => void;
  minimize: () => void;
  close: () => void;
  setAlwaysOnTop: (value: boolean) => void;
  setIgnoreMouse: (ignore: boolean, forward?: boolean) => void;
  toggleCompactSize: (compact: boolean) => void;
  openExternal: (url: string) => void;
}

declare global {
  interface Window {
    taskWidget: TaskWidgetAPI;
  }
}
