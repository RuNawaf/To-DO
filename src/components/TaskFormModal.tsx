import { useState } from "react";
import { CATEGORIES, type Category, type NewTaskInput, type Priority, type Task } from "../../shared/types";
import { PRIORITY_META } from "../utils/category";

interface Props {
  initial?: Task | null;
  onCancel: () => void;
  onSave: (input: NewTaskInput) => void;
}

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function TaskFormModal({ initial, onCancel, onSave }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "دراسة");
  const [deadlineLocal, setDeadlineLocal] = useState(toLocalInputValue(initial?.deadline ?? null));
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [why, setWhy] = useState(initial?.why ?? "");
  const [smallestStep, setSmallestStep] = useState(initial?.smallestStep ?? "");
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [subtasks, setSubtasks] = useState(initial?.subtasks ?? []);

  const canSave = title.trim().length > 0;

  function addSubtaskDraft() {
    if (!subtaskDraft.trim()) return;
    setSubtasks([...subtasks, { id: `s-${Date.now()}`, title: subtaskDraft.trim(), done: false }]);
    setSubtaskDraft("");
  }

  function handleSave() {
    if (!canSave) return;
    const input: NewTaskInput = {
      title: title.trim(),
      category,
      deadline: deadlineLocal ? new Date(deadlineLocal).toISOString() : null,
      priority,
      why: why.trim(),
      smallestStep: smallestStep.trim(),
      subtasks,
      notes: initial?.notes ?? [],
      snoozedUntil: null,
    };
    onSave(input);
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial ? "تعديل المهمة" : "مهمة جديدة"}</h2>

        <div className="field">
          <label>اسم المهمة</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: رفع فيديو التقديم"
          />
        </div>

        <div className="field">
          <label>التصنيف</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>الموعد النهائي</label>
          <input
            type="datetime-local"
            value={deadlineLocal}
            onChange={(e) => setDeadlineLocal(e.target.value)}
          />
        </div>

        <div className="field">
          <label>الأولوية</label>
          <div className="priority-group">
            {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
              <div
                key={p}
                className={`priority-option${priority === p ? " active" : ""}`}
                onClick={() => setPriority(p)}
              >
                {PRIORITY_META[p].dot} {PRIORITY_META[p].label}
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <label>ليش لازم أسويها؟</label>
          <textarea
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="اكتب سببًا يذكّرك ليش هالمهمة مهمة..."
          />
        </div>

        <div className="field">
          <label>أصغر خطوة تبدأ فيها (تُستخدم في زر "مالي خلق")</label>
          <input
            value={smallestStep}
            onChange={(e) => setSmallestStep(e.target.value)}
            placeholder="مثال: افتح الكاميرا وسجل أول محاولة"
          />
        </div>

        <div className="field">
          <label>خطوات صغيرة (Subtasks)</label>
          {subtasks.map((s) => (
            <div className="subtask-row" key={s.id}>
              <span>• {s.title}</span>
              <button
                className="icon-btn danger"
                onClick={() => setSubtasks(subtasks.filter((x) => x.id !== s.id))}
              >
                ✕
              </button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <input
              value={subtaskDraft}
              onChange={(e) => setSubtaskDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSubtaskDraft()}
              placeholder="أضف خطوة..."
            />
            <button className="btn ghost" style={{ flex: "0 0 auto", padding: "0 12px" }} onClick={addSubtaskDraft}>
              +
            </button>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn ghost" onClick={onCancel}>
            إلغاء
          </button>
          <button className="btn primary" disabled={!canSave} onClick={handleSave}>
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}
