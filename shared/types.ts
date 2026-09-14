export type Category =
  | "دراسة"
  | "اختبار"
  | "ورشة"
  | "محاضرة"
  | "نادي"
  | "فرصة"
  | "تقديم"
  | "مشروع"
  | "شخصي";

export const CATEGORIES: Category[] = [
  "دراسة",
  "اختبار",
  "ورشة",
  "محاضرة",
  "نادي",
  "فرصة",
  "تقديم",
  "مشروع",
  "شخصي",
];

export type Priority = "high" | "medium" | "low";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  category: Category;
  deadline: string | null; // ISO string
  priority: Priority;
  why: string; // "ليش لازم أسويها؟"
  smallestStep: string; // used by the "مالي خلق" flow
  subtasks: Subtask[];
  notes: string[];
  done: boolean;
  createdAt: string;
  updatedAt: string;
  snoozedUntil: string | null;
  notifiedThresholds: number[]; // minutes-before-deadline thresholds already fired
}

export type NewTaskInput = Omit<
  Task,
  "id" | "createdAt" | "updatedAt" | "done" | "notifiedThresholds"
>;

export type ThemeMode = "light" | "dark" | "system";

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Settings {
  theme: ThemeMode;
  alwaysOnTop: boolean;
  autoStart: boolean;
  compact: boolean;
  idleOpacity: number; // 0.2 - 1
  windowBounds: WindowBounds | null;
  locked: boolean; // prevent accidental drag/resize
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  alwaysOnTop: true,
  autoStart: true,
  compact: false,
  idleOpacity: 0.55,
  windowBounds: null,
  locked: false,
};

export interface AppState {
  tasks: Task[];
  settings: Settings;
}

// Reminder thresholds in minutes before deadline: 3 days, 1 day, 4 hours, 1 hour, 30 min
export const REMINDER_THRESHOLDS_MIN = [3 * 24 * 60, 24 * 60, 4 * 60, 60, 30];
