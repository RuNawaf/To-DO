import { kindForCategory, type Category, type ChecklistItem, type Task } from "./types";

/**
 * Tasks created before the per-category redesign were a single flat shape
 * (title/category/deadline/priority/why/smallestStep/subtasks/notes/...).
 * This upgrades any such record into the matching kind-specific shape so
 * existing data keeps working instead of crashing the UI.
 */
export function migrateTask(raw: any): Task {
  if (raw && typeof raw.kind === "string") {
    return raw as Task;
  }

  const category: Category = raw?.category ?? "شخصي";
  const kind = kindForCategory(category);
  const oldSubtasks: ChecklistItem[] = Array.isArray(raw?.subtasks) ? raw.subtasks : [];
  const oldDeadline: string | null = raw?.deadline ?? null;

  const base = {
    id: raw?.id ?? `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: raw?.title ?? "مهمة بدون اسم",
    category,
    priority: raw?.priority ?? "medium",
    why: raw?.why ?? "",
    smallestStep: raw?.smallestStep ?? "",
    notes: Array.isArray(raw?.notes) ? raw.notes : [],
    done: Boolean(raw?.done),
    createdAt: raw?.createdAt ?? new Date().toISOString(),
    updatedAt: raw?.updatedAt ?? new Date().toISOString(),
    snoozedUntil: raw?.snoozedUntil ?? null,
    notifiedThresholds: Array.isArray(raw?.notifiedThresholds) ? raw.notifiedThresholds : [],
    notifiedForDeadline: null,
  };

  switch (kind) {
    case "study":
      return {
        ...base,
        kind,
        parts: oldSubtasks,
        companionLabel: "",
        companionDate: oldDeadline,
      };
    case "event":
      return {
        ...base,
        kind,
        dateTime: oldDeadline,
        location: "",
        attended: false,
        steps: oldSubtasks,
      };
    case "recurring": {
      let dayOfWeek: number | null = null;
      let time: string | null = null;
      if (oldDeadline) {
        const d = new Date(oldDeadline);
        if (!isNaN(d.getTime())) {
          dayOfWeek = d.getDay();
          time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        }
      }
      return {
        ...base,
        kind,
        dayOfWeek,
        time,
        recurring: true,
        doneMarkedAt: null,
      };
    }
    case "opportunity":
      return {
        ...base,
        kind,
        deadline: oldDeadline,
        checklist: oldSubtasks,
      };
    case "project":
      return {
        ...base,
        kind,
        phases: oldSubtasks,
        deadline: oldDeadline,
        deadlineRequired: false,
      };
    case "simple":
    default:
      return {
        ...base,
        kind: "simple",
        deadline: oldDeadline,
      };
  }
}
