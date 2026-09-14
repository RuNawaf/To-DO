import Store from "electron-store";
import type { AppState } from "../shared/types";
import { DEFAULT_SETTINGS } from "../shared/types";

const store = new Store<AppState>({
  name: "taskwidget-data",
  defaults: {
    tasks: [],
    settings: DEFAULT_SETTINGS,
  },
});

export function getTasks() {
  return store.get("tasks");
}

export function setTasks(tasks: AppState["tasks"]) {
  store.set("tasks", tasks);
}

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...store.get("settings") };
}

export function setSettings(settings: AppState["settings"]) {
  store.set("settings", settings);
}

export function getState(): AppState {
  return { tasks: getTasks(), settings: getSettings() };
}

export default store;
