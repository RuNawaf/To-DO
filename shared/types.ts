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

export interface ChecklistItem {
  id: string;
  title: string;
  done: boolean;
}

export const WEEKDAYS_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

/**
 * Each category maps to one of these shapes. The shape decides which fields
 * the add/edit form and the detail view show — categories are not just a
 * label, they change what the task *is*.
 */
export type TaskKind =
  | "study" // دراسة / اختبار — parts + progress, optional companion date
  | "event" // ورشة / محاضرة — date/time + location + attended
  | "recurring" // نادي — weekly day/time + "تم اليوم"
  | "opportunity" // فرصة / تقديم — required deadline + checklist + why-apply
  | "project" // مشروع — phases + progress, optional/required deadline
  | "simple"; // شخصي (fallback) — title + optional deadline + notes

export function kindForCategory(category: Category): TaskKind {
  switch (category) {
    case "دراسة":
    case "اختبار":
      return "study";
    case "ورشة":
    case "محاضرة":
      return "event";
    case "نادي":
      return "recurring";
    case "فرصة":
    case "تقديم":
      return "opportunity";
    case "مشروع":
      return "project";
    case "شخصي":
    default:
      return "simple";
  }
}

interface BaseTask {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  why: string; // "ليش لازم أسويها؟" (opportunity: "ليش أبي أقدم؟")
  smallestStep: string; // used by the "مالي خلق" flow
  notes: string[];
  done: boolean;
  createdAt: string;
  updatedAt: string;
  snoozedUntil: string | null;
  notifiedThresholds: number[]; // minutes-before-deadline thresholds already fired
  notifiedForDeadline: string | null; // the effective deadline notifiedThresholds was computed against
}

export interface StudyTask extends BaseTask {
  kind: "study";
  parts: ChecklistItem[]; // "أجزاء الدراسة"
  companionLabel: string; // e.g. "الاختبار يوم الخميس"
  companionDate: string | null; // optional — only used for sorting/countdown
}

export interface EventTask extends BaseTask {
  kind: "event";
  dateTime: string | null;
  location: string; // مكان أو رابط
  attended: boolean;
  steps: ChecklistItem[]; // optional extra steps
}

export interface RecurringTask extends BaseTask {
  kind: "recurring";
  dayOfWeek: number | null; // 0 = الأحد ... 6 = السبت (matches Date#getDay)
  time: string | null; // "HH:mm"
  recurring: boolean; // repeats weekly instead of ending
  doneMarkedAt: string | null; // when "تم اليوم" was last checked
}

export interface OpportunityTask extends BaseTask {
  kind: "opportunity";
  deadline: string | null; // essential, but kept nullable for a brief invalid draft state
  checklist: ChecklistItem[];
}

export interface ProjectTask extends BaseTask {
  kind: "project";
  phases: ChecklistItem[];
  deadline: string | null;
  deadlineRequired: boolean;
}

export interface SimpleTask extends BaseTask {
  kind: "simple";
  deadline: string | null;
}

export type Task =
  | StudyTask
  | EventTask
  | RecurringTask
  | OpportunityTask
  | ProjectTask
  | SimpleTask;

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

export type NewTaskInput = DistributiveOmit<
  Task,
  "id" | "createdAt" | "updatedAt" | "done" | "notifiedThresholds" | "notifiedForDeadline"
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

/**
 * A lightweight, low-commitment item — separate from Task. No categories,
 * no deadlines-as-obligation, just "title (+ optional time/description)"
 * for things the user may want to do someday.
 */
export interface Idea {
  id: string;
  title: string;
  time: string | null; // "HH:mm", optional
  description: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NewIdeaInput = Omit<Idea, "id" | "createdAt" | "updatedAt" | "done">;

export interface AppState {
  tasks: Task[];
  ideas: Idea[];
  settings: Settings;
}

// Reminder thresholds in minutes before deadline: 3 days, 1 day, 4 hours, 1 hour, 30 min
export const REMINDER_THRESHOLDS_MIN = [3 * 24 * 60, 24 * 60, 4 * 60, 60, 30];
