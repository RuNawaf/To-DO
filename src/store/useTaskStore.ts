import { create } from "zustand";
import type { ChecklistItem, Idea, NewIdeaInput, NewTaskInput, Settings, Task } from "../../shared/types";
import { DEFAULT_SETTINGS } from "../../shared/types";
import { getEffectiveDeadline, withChecklist } from "../../shared/taskLogic";
import { urgencyOf } from "../utils/countdown";

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface TaskStoreState {
  tasks: Task[];
  ideas: Idea[];
  settings: Settings;
  loaded: boolean;
  activeTaskId: string | null;
  init: () => Promise<void>;
  addTask: (input: NewTaskInput) => void;
  editTask: (id: string, input: NewTaskInput) => void;
  deleteTask: (id: string) => void;
  toggleDone: (id: string) => void;
  setChecklist: (taskId: string, items: ChecklistItem[]) => void;
  toggleAttended: (taskId: string) => void;
  toggleDoneToday: (taskId: string) => void;
  addNote: (taskId: string, note: string) => void;
  snoozeTask: (taskId: string, minutes: number) => void;
  addIdea: (input: NewIdeaInput) => void;
  toggleIdeaDone: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setActiveTask: (id: string | null) => void;
}

function persistTasks(tasks: Task[]) {
  window.taskWidget?.setTasks(tasks);
}

function persistIdeas(ideas: Idea[]) {
  window.taskWidget?.setIdeas(ideas);
}

function persistSettings(settings: Settings) {
  window.taskWidget?.setSettings(settings);
}

function touch(task: Task): Task {
  return { ...task, updatedAt: new Date().toISOString() };
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  ideas: [],
  settings: DEFAULT_SETTINGS,
  loaded: false,
  activeTaskId: null,

  init: async () => {
    if (!window.taskWidget) {
      set({ loaded: true });
      return;
    }
    const state = await window.taskWidget.getState();
    set({ tasks: state.tasks, ideas: state.ideas, settings: state.settings, loaded: true });
    window.taskWidget.onStateChanged((s) => {
      set({ tasks: s.tasks, ideas: s.ideas, settings: s.settings });
    });
  },

  addTask: (input) => {
    const now = new Date().toISOString();
    const task = {
      ...input,
      id: uid(),
      createdAt: now,
      updatedAt: now,
      done: false,
      notifiedThresholds: [],
      notifiedForDeadline: null,
    } as Task;
    const tasks = [...get().tasks, task];
    set({ tasks });
    persistTasks(tasks);
  },

  editTask: (id, input) => {
    const tasks = get().tasks.map((t) => {
      if (t.id !== id) return t;
      const merged = {
        ...input,
        id: t.id,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        done: t.done,
        notifiedThresholds: [],
        notifiedForDeadline: null,
      } as Task;
      return touch(merged);
    });
    set({ tasks });
    persistTasks(tasks);
  },

  deleteTask: (id) => {
    const tasks = get().tasks.filter((t) => t.id !== id);
    set({ tasks, activeTaskId: get().activeTaskId === id ? null : get().activeTaskId });
    persistTasks(tasks);
  },

  toggleDone: (id) => {
    const tasks = get().tasks.map((t) => (t.id === id ? touch({ ...t, done: !t.done }) : t));
    set({ tasks });
    persistTasks(tasks);
  },

  setChecklist: (taskId, items) => {
    const tasks = get().tasks.map((t) => (t.id === taskId ? touch(withChecklist(t, items)) : t));
    set({ tasks });
    persistTasks(tasks);
  },

  toggleAttended: (taskId) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId && t.kind === "event" ? touch({ ...t, attended: !t.attended }) : t
    );
    set({ tasks });
    persistTasks(tasks);
  },

  toggleDoneToday: (taskId) => {
    const tasks = get().tasks.map((t) => {
      if (t.id !== taskId || t.kind !== "recurring") return t;
      return touch({ ...t, doneMarkedAt: t.doneMarkedAt ? null : new Date().toISOString() });
    });
    set({ tasks });
    persistTasks(tasks);
  },

  addNote: (taskId, note) => {
    if (!note.trim()) return;
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? touch({ ...t, notes: [...t.notes, note.trim()] }) : t
    );
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

  addIdea: (input) => {
    const now = new Date().toISOString();
    const idea: Idea = { ...input, id: uid(), createdAt: now, updatedAt: now, done: false };
    const ideas = [...get().ideas, idea];
    set({ ideas });
    persistIdeas(ideas);
  },

  toggleIdeaDone: (id) => {
    const ideas = get().ideas.map((i) =>
      i.id === id ? { ...i, done: !i.done, updatedAt: new Date().toISOString() } : i
    );
    set({ ideas });
    persistIdeas(ideas);
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
  const nowDate = new Date(now);
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
    const deadlineA = getEffectiveDeadline(a, nowDate);
    const deadlineB = getEffectiveDeadline(b, nowDate);
    const ua = urgencyRank[urgencyOf(deadlineA, now)];
    const ub = urgencyRank[urgencyOf(deadlineB, now)];
    if (ua !== ub) return ua - ub;
    if (deadlineA && deadlineB) {
      return new Date(deadlineA).getTime() - new Date(deadlineB).getTime();
    }
    if (deadlineA) return -1;
    if (deadlineB) return 1;
    const priorityRank = { high: 0, medium: 1, low: 2 };
    return priorityRank[a.priority] - priorityRank[b.priority];
  });
}

export function sortedIdeas(ideas: Idea[]): Idea[] {
  return [...ideas].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}
