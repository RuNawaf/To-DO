import type { ChecklistItem, RecurringTask, Task } from "./types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function nextWeeklyOccurrence(dayOfWeek: number, time: string, now = new Date()): Date {
  const [hh, mm] = time.split(":").map(Number);
  const result = new Date(now);
  const currentDay = now.getDay();
  const diff = (dayOfWeek - currentDay + 7) % 7;
  result.setDate(now.getDate() + diff);
  result.setHours(hh, mm, 0, 0);
  if (diff === 0 && result.getTime() <= now.getTime()) {
    result.setDate(result.getDate() + 7);
  }
  return result;
}

export function isDoneForCurrentCycle(task: RecurringTask, now = new Date()): boolean {
  if (!task.doneMarkedAt || task.dayOfWeek === null || !task.time) return false;
  const next = nextWeeklyOccurrence(task.dayOfWeek, task.time, now);
  const cycleStart = new Date(next.getTime() - WEEK_MS);
  return new Date(task.doneMarkedAt).getTime() >= cycleStart.getTime();
}

/** The single date/time each task kind is judged against for countdown, sorting and notifications. */
export function getEffectiveDeadline(task: Task, now = new Date()): string | null {
  switch (task.kind) {
    case "study":
      return task.companionDate;
    case "event":
      return task.dateTime;
    case "recurring":
      if (task.dayOfWeek === null || !task.time) return null;
      return nextWeeklyOccurrence(task.dayOfWeek, task.time, now).toISOString();
    case "opportunity":
      return task.deadline;
    case "project":
      return task.deadline;
    case "simple":
      return task.deadline;
  }
}

/** The single checklist field a task kind exposes, or null if it has none. */
export function getChecklist(task: Task): ChecklistItem[] | null {
  switch (task.kind) {
    case "study":
      return task.parts;
    case "event":
      return task.steps;
    case "opportunity":
      return task.checklist;
    case "project":
      return task.phases;
    default:
      return null;
  }
}

export function withChecklist(task: Task, items: ChecklistItem[]): Task {
  switch (task.kind) {
    case "study":
      return { ...task, parts: items };
    case "event":
      return { ...task, steps: items };
    case "opportunity":
      return { ...task, checklist: items };
    case "project":
      return { ...task, phases: items };
    default:
      return task;
  }
}

export interface Progress {
  done: number;
  total: number;
  percent: number;
}

export function getProgress(task: Task): Progress | null {
  const items = getChecklist(task);
  if (!items || items.length === 0) return null;
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, percent: Math.round((done / items.length) * 100) };
}
