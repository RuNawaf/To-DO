import { Notification } from "electron";
import { REMINDER_THRESHOLDS_MIN, type Task } from "../shared/types";
import { getTasks, setTasks } from "./store";

const CHECK_INTERVAL_MS = 30_000;

function formatRemaining(minutes: number): string {
  if (minutes >= 24 * 60) {
    const days = Math.round(minutes / (24 * 60));
    return days === 1 ? "يوم واحد" : `${days} أيام`;
  }
  if (minutes >= 60) {
    const hours = Math.round(minutes / 60);
    return hours === 1 ? "ساعة واحدة" : `${hours} ساعات`;
  }
  return `${Math.max(1, Math.round(minutes))} دقيقة`;
}

function checkAndNotify(onChange: (tasks: Task[]) => void) {
  const tasks = getTasks();
  const now = Date.now();
  let changed = false;

  const updated = tasks.map((task) => {
    if (task.done || !task.deadline) return task;
    if (task.snoozedUntil && new Date(task.snoozedUntil).getTime() > now) {
      return task;
    }

    const deadlineMs = new Date(task.deadline).getTime();
    const minutesLeft = (deadlineMs - now) / 60000;
    if (minutesLeft <= 0) return task;

    for (const threshold of REMINDER_THRESHOLDS_MIN) {
      if (
        minutesLeft <= threshold &&
        !task.notifiedThresholds.includes(threshold)
      ) {
        fireNotification(task, threshold);
        changed = true;
        return {
          ...task,
          notifiedThresholds: [...task.notifiedThresholds, threshold],
        };
      }
    }
    return task;
  });

  if (changed) {
    setTasks(updated);
    onChange(updated);
  }
}

function fireNotification(task: Task, threshold: number) {
  const remaining = formatRemaining(threshold);
  const body = task.why
    ? `باقي ${remaining} على "${task.title}".\n${task.why}`
    : `باقي ${remaining} على "${task.title}".`;

  const notification = new Notification({
    title: `⏰ ${task.title}`,
    body,
    silent: false,
  });
  notification.show();
}

let interval: NodeJS.Timeout | null = null;

export function startNotificationScheduler(onChange: (tasks: Task[]) => void) {
  if (interval) clearInterval(interval);
  checkAndNotify(onChange);
  interval = setInterval(() => checkAndNotify(onChange), CHECK_INTERVAL_MS);
}

export function stopNotificationScheduler() {
  if (interval) clearInterval(interval);
  interval = null;
}
