import { useTaskStore } from "../store/useTaskStore";
import { urgencyOf, formatCountdown, type Urgency } from "../utils/countdown";
import { CATEGORY_META, PRIORITY_META } from "../utils/category";
import type { Task } from "../../shared/types";

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
  const snoozeTask = useTaskStore((s) => s.snoozeTask);
  const urgency = urgencyOf(task.deadline, now);
  const category = CATEGORY_META[task.category];
  const priority = PRIORITY_META[task.priority];

  const isSnoozed = task.snoozedUntil && new Date(task.snoozedUntil).getTime() > now;

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
          {isSnoozed ? "🔕 مؤجل" : formatCountdown(task.deadline, now)}
        </span>
      </div>

      {!compact && (
        <>
          <div className="task-meta">
            <span className="chip">{task.category}</span>
            {task.subtasks.length > 0 && (
              <span className="chip">
                {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length} خطوات
              </span>
            )}
          </div>

          {task.why && <div className="task-why">"{task.why}"</div>}

          <div className="task-quick-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="icon-btn"
              title="إنهاء المهمة"
              onClick={() => toggleDone(task.id)}
            >
              ✓
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
          </div>
        </>
      )}
    </div>
  );
}
