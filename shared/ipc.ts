export const IPC = {
  GET_STATE: "state:get",
  SET_TASKS: "tasks:set",
  SET_IDEAS: "ideas:set",
  SET_SETTINGS: "settings:set",
  STATE_CHANGED: "state:changed",
  WINDOW_MINIMIZE: "window:minimize",
  WINDOW_CLOSE: "window:close",
  WINDOW_SET_ALWAYS_ON_TOP: "window:set-always-on-top",
  WINDOW_SET_IGNORE_MOUSE: "window:set-ignore-mouse",
  WINDOW_TOGGLE_COMPACT_SIZE: "window:toggle-compact-size",
  NOTIFY: "notify:show",
  OPEN_EXTERNAL: "shell:open-external",
} as const;
