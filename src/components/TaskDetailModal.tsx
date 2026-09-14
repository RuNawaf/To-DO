import { useState } from "react";
import { useTaskStore } from "../store/useTaskStore";
import { formatCountdown, formatDeadlineDate } from "../utils/countdown";
import { CATEGORY_META, PRIORITY_META } from "../utils/category";
import type { Task } from "../../shared/types";
import { useNow } from "../hooks";

interface Props {
  task: Task;
  focusNote?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onOpenMotivation: () => void;
}

export default function TaskDetailModal({ task, focusNote, onClose, onEdit, onOpenMotivation }: Props) {
  const now = useNow(5000);
  const toggleSubtask = useTaskStore((s) => s.toggleSubtask);
  const addNote = useTaskStore((s) => s.addNote);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const toggleDone = useTaskStore((s) => s.toggleDone);
  const [noteDraft, setNoteDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const category = CATEGORY_META[task.category];
  const priority = PRIORITY_META[task.priority];

  function submitNote() {
    if (!noteDraft.trim()) return;
    addNote(task.id, noteDraft);
    setNoteDraft("");
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>
          {category.emoji} {task.title}
        </h2>

        <div className="task-meta" style={{ marginBottom: 10 }}>
          <span className="chip">{task.category}</span>
          <span className="chip">
            {priority.dot} {priority.label}
          </span>
        </div>

        {task.deadline && (
          <div className="field">
            <label>الوقت المتبقي</label>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{formatCountdown(task.deadline, now)}</div>
            <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
              {formatDeadlineDate(task.deadline)}
            </div>
          </div>
        )}

        {task.why && (
          <div className="motivation-box">
            <div className="label">ليش لازم أسويها؟</div>
            <p className="why-text">{task.why}</p>
            <button className="btn primary" style={{ width: "100%" }} onClick={onOpenMotivation}>
              مالي خلق 😩
            </button>
          </div>
        )}

        {task.subtasks.length > 0 && (
          <div className="field">
            <label>
              الخطوات ({task.subtasks.filter((s) => s.done).length}/{task.subtasks.length})
            </label>
            {task.subtasks.map((s) => (
              <div className="subtask-row" key={s.id} onClick={() => toggleSubtask(task.id, s.id)}>
                <span style={{ cursor: "pointer" }}>{s.done ? "☑" : "☐"}</span>
                <span className={s.done ? "subtask-done" : ""}>{s.title}</span>
              </div>
            ))}
          </div>
        )}

        <div className="field">
          <label>ملاحظات</label>
          {task.notes.map((n, i) => (
            <div key={i} style={{ fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
              {n}
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <input
              autoFocus={focusNote}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitNote()}
              placeholder="أضف ملاحظة..."
            />
            <button className="btn ghost" style={{ flex: "0 0 auto", padding: "0 12px" }} onClick={submitNote}>
              +
            </button>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn ghost" onClick={onEdit}>
            تعديل
          </button>
          <button className="btn primary" onClick={() => toggleDone(task.id)}>
            {task.done ? "إرجاع للنشطة" : "✓ إنهاء"}
          </button>
        </div>
        <div className="modal-actions">
          {confirmDelete ? (
            <>
              <button className="btn ghost" onClick={() => setConfirmDelete(false)}>
                تراجع
              </button>
              <button className="btn danger" onClick={() => deleteTask(task.id)}>
                تأكيد الحذف
              </button>
            </>
          ) : (
            <button className="btn danger" onClick={() => setConfirmDelete(true)}>
              حذف المهمة
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
