import { create } from "zustand";
import type { NewTaskInput, Settings, Subtask, Task } from "../../shared/types";
import { DEFAULT_SETTINGS } from "../../shared/types";
import { urgencyOf } from "../utils/countdown";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface TaskStoreState {
  tasks: Task[];
  settings: Settings;
  loaded: boolean;
  activeTaskId: string | null;
  init: () => Promise<void>;
  addTask: (input: NewTaskInput) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleDone: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  addNote: (taskId: string, note: string) => void;
  snoozeTask: (taskId: string, minutes: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setActiveTask: (id: string | null) => void;
}

function persistTasks(tasks: Task[]) {
  window.taskWidget?.setTasks(tasks);
}

function persistSettings(settings: Settings) {
  window.taskWidget?.setSettings(settings);
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  settings: DEFAULT_SETTINGS,
  loaded: false,
  activeTaskId: null,

  init: async () => {
    if (!window.taskWidget) {
      set({ loaded: true });
      return;
    }
    const state = await window.taskWidget.getState();
    set({ tasks: state.tasks, settings: state.settings, loaded: true });
    window.taskWidget.onStateChanged((s) => {
      set({ tasks: s.tasks, settings: s.settings });
    });
  },

  addTask: (input) => {
    const now = new Date().toISOString();
    const task: Task = {
      ...input,
      id: uid(),
      createdAt: now,
      updatedAt: now,
      done: false,
      notifiedThresholds: [],
    };
    const tasks = [...get().tasks, task];
    set({ tasks });
    persistTasks(tasks);
  },

  updateTask: (id, patch) => {
    const tasks = get().tasks.map((t) =>
      t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
    );
    set({ tasks });
    persistTasks(tasks);
  },

  deleteTask: (id) => {
    const tasks = get().tasks.filter((t) => t.id !== id);
    set({ tasks, activeTaskId: get().activeTaskId === id ? null : get().activeTaskId });
    persistTasks(tasks);
  },

  toggleDone: (id) => {
    const tasks = get().tasks.map((t) =>
      t.id === id ? { ...t, done: !t.done, updatedAt: new Date().toISOString() } : t
    );
    set({ tasks });
    persistTasks(tasks);
  },

  toggleSubtask: (taskId, subtaskId) => {
    const tasks = get().tasks.map((t) => {
      if (t.id !== taskId) return t;
      const subtasks: Subtask[] = t.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, done: !s.done } : s
      );
      return { ...t, subtasks, updatedAt: new Date().toISOString() };
    });
    set({ tasks });
    persistTasks(tasks);
  },

  addSubtask: (taskId, title) => {
    if (!title.trim()) return;
    const tasks = get().tasks.map((t) => {
      if (t.id !== taskId) return t;
      const subtasks = [...t.subtasks, { id: uid(), title: title.trim(), done: false }];
      return { ...t, subtasks, updatedAt: new Date().toISOString() };
    });
    set({ tasks });
    persistTasks(tasks);
  },

  addNote: (taskId, note) => {
    if (!note.trim()) return;
    const tasks = get().tasks.map((t) => {
      if (t.id !== taskId) return t;
      return { ...t, notes: [...t.notes, note.trim()], updatedAt: new Date().toISOString() };
    });
    set({ tasks });
    persistTasks(tasks);
  },

  snoozeTask: (taskId, minutes) => {
    const tasks = get().tasks.map((t) => {
      if (t.id !== taskId) return t;
      const until = new Date(Date.now() + minutes * 60000).toISOString();
      return { ...t, snoozedUntil: until };
    });
    set({ tasks });
    persistTasks(tasks);
  },

  updateSettings: (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    persistSettings(settings);
  },

  setActiveTask: (id) => set({ activeTaskId: id }),
}));

export function sortedVisibleTasks(tasks: Task[], showDone: boolean): Task[] {
  const now = Date.now();
  const filtered = showDone ? tasks : tasks.filter((t) => !t.done);
  const urgencyRank: Record<string, number> = {
    overdue: 0,
    critical: 1,
    soon: 2,
    upcoming: 3,
    none: 4,
  };
  return [...filtered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const ua = urgencyRank[urgencyOf(a.deadline, now)];
    const ub = urgencyRank[urgencyOf(b.deadline, now)];
    if (ua !== ub) return ua - ub;
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    const priorityRank = { high: 0, medium: 1, low: 2 };
    return priorityRank[a.priority] - priorityRank[b.priority];
  });
}
