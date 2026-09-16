import Store from "electron-store";
import type { AppState } from "../shared/types";
import { DEFAULT_SETTINGS } from "../shared/types";
import { migrateTask } from "../shared/migrate";

const store = new Store<AppState>({
  name: "taskwidget-data",
  defaults: {
    tasks: [],
    ideas: [],
    settings: DEFAULT_SETTINGS,
  },
});

export function getTasks() {
  const raw = store.get("tasks");
  const migrated = raw.map(migrateTask);
  if (JSON.stringify(migrated) !== JSON.stringify(raw)) {
    store.set("tasks", migrated);
  }
  return migrated;
}

export function setTasks(tasks: AppState["tasks"]) {
  store.set("tasks", tasks);
}

export function getIdeas() {
  return store.get("ideas") ?? [];
}

export function setIdeas(ideas: AppState["ideas"]) {
  store.set("ideas", ideas);
}

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...store.get("settings") };
}

export function setSettings(settings: AppState["settings"]) {
  store.set("settings", settings);
}

export function getState(): AppState {
  return { tasks: getTasks(), ideas: getIdeas(), settings: getSettings() };
}

export default store;
