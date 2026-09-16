import { useTaskStore } from "../store/useTaskStore";
import { urgencyOf, formatCountdown, type Urgency } from "../utils/countdown";
import { CATEGORY_META, PRIORITY_META } from "../utils/category";
import type { Task } from "../../shared/types";
import { WEEKDAYS_AR } from "../../shared/types";
import { getEffectiveDeadline, getProgress, isDoneForCurrentCycle } from "../../shared/taskLogic";
import ProgressBar from "./ProgressBar";
import { useConfirmAction } from "../hooks";

const URGENCY_COLOR: Record<Urgency, string> = {
  overdue: "#ef4444",
  critical: "#ef4444",
  soon: "#f59e0b",
  upcoming: "#22c55e",
  none: "rgba(148,148,160,0.4)",
};

interface Props {
  task: Task;
  now: number;
  compact: boolean;
  onOpen: (id: string) => void;
  onQuickNote: (id: string) => void;
}

export default function TaskCard({ task, now, compact, onOpen, onQuickNote }: Props) {
  const toggleDone = useTaskStore((s) => s.toggleDone);
  const toggleAttended = useTaskStore((s) => s.toggleAttended);
  const toggleDoneToday = useTaskStore((s) => s.toggleDoneToday);
  const snoozeTask = useTaskStore((s) => s.snoozeTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const [confirmingDelete, triggerDelete] = useConfirmAction(() => deleteTask(task.id));

  const nowDate = new Date(now);
  const effectiveDeadline = getEffectiveDeadline(task, nowDate);
  const urgency = urgencyOf(effectiveDeadline, now);
  const category = CATEGORY_META[task.category];
  const priority = PRIORITY_META[task.priority];
  const progress = getProgress(task);
  const isSnoozed = task.snoozedUntil && new Date(task.snoozedUntil).getTime() > now;

  const badgeText = isSnoozed
    ? "🔕 مؤجل"
    : effectiveDeadline
      ? formatCountdown(effectiveDeadline, now)
      : progress
        ? `${progress.percent}%`
        : "بدون موعد";

  const quickChecked =
    task.kind === "event" ? task.attended : task.kind === "recurring" ? isDoneForCurrentCycle(task, nowDate) : task.done;

  function handleQuickCheck() {
    if (task.kind === "event") toggleAttended(task.id);
    else if (task.kind === "recurring") toggleDoneToday(task.id);
    else toggleDone(task.id);
  }

  return (
    <div
      className={`task-card${task.done ? " done" : ""}`}
      style={{ ["--urgency-color" as string]: URGENCY_COLOR[urgency] }}
      onClick={() => onOpen(task.id)}
    >
      <div className="task-card-top">
        <div className="task-title-row">
          <span>{priority.dot}</span>
          <span className={`task-title${task.done ? " done" : ""}`}>
            {category.emoji} {task.title}
          </span>
        </div>
        <span className="task-countdown" style={{ ["--urgency-color" as string]: URGENCY_COLOR[urgency] }}>
          {badgeText}
        </span>
      </div>

      {!compact && (
        <>
          <div className="task-meta">
            <span className="chip">{task.category}</span>

            {task.kind === "study" && task.companionLabel && (
              <span className="chip">{task.companionLabel}</span>
            )}
            {task.kind === "recurring" && task.dayOfWeek !== null && (
              <span className="chip">
                {WEEKDAYS_AR[task.dayOfWeek]} {task.time}
              </span>
            )}
            {task.kind === "recurring" && task.recurring && <span className="chip">🔁 أسبوعي</span>}
            {task.kind === "event" && task.location && <span className="chip">📍 {task.location}</span>}
            {progress && (
              <span className="chip">
                {progress.done}/{progress.total}{" "}
                {task.kind === "study" ? "أجزاء" : task.kind === "project" ? "مراحل" : "خطوات"}
              </span>
            )}
          </div>

          {progress && <ProgressBar percent={progress.percent} />}

          {task.why && <div className="task-why">"{task.why}"</div>}

          <div className="task-quick-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="icon-btn"
              title={
                task.kind === "event" ? "حضرت" : task.kind === "recurring" ? "تم اليوم" : "إنهاء المهمة"
              }
              onClick={handleQuickCheck}
            >
              {quickChecked ? "☑" : "✓"}
            </button>
            <button className="icon-btn" title="فتح المهمة" onClick={() => onOpen(task.id)}>
              →
            </button>
            <button
              className="icon-btn"
              title="تأجيل التذكير ساعة"
              onClick={() => snoozeTask(task.id, 60)}
            >
              ⏰
            </button>
            <button
              className="icon-btn"
              title="إضافة ملاحظة"
              onClick={() => onQuickNote(task.id)}
            >
              📝
            </button>
            <button
              className={`icon-btn danger${confirmingDelete ? " confirming" : ""}`}
              title={confirmingDelete ? "اضغط مرة ثانية للتأكيد" : "حذف المهمة"}
              onClick={triggerDelete}
            >
              {confirmingDelete ? "تأكيد؟" : "🗑"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
