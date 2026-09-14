import { useState } from "react";
import { useTaskStore } from "../store/useTaskStore";
import { formatCountdown, formatDeadlineDate } from "../utils/countdown";
import { CATEGORY_META, PRIORITY_META } from "../utils/category";
import type { Task } from "../../shared/types";
import { WEEKDAYS_AR } from "../../shared/types";
import { getEffectiveDeadline, getProgress, isDoneForCurrentCycle } from "../../shared/taskLogic";
import { useNow } from "../hooks";
import ChecklistEditor from "./ChecklistEditor";
import ProgressBar from "./ProgressBar";

interface Props {
  task: Task;
  focusNote?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onOpenMotivation: () => void;
}

export default function TaskDetailModal({ task, focusNote, onClose, onEdit, onOpenMotivation }: Props) {
  const now = useNow(5000);
  const setChecklist = useTaskStore((s) => s.setChecklist);
  const toggleAttended = useTaskStore((s) => s.toggleAttended);
  const toggleDoneToday = useTaskStore((s) => s.toggleDoneToday);
  const addNote = useTaskStore((s) => s.addNote);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const toggleDone = useTaskStore((s) => s.toggleDone);
  const [noteDraft, setNoteDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const category = CATEGORY_META[task.category];
  const priority = PRIORITY_META[task.priority];
  const effectiveDeadline = getEffectiveDeadline(task, new Date(now));
  const progress = getProgress(task);

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
          {task.kind === "recurring" && task.recurring && <span className="chip">🔁 أسبوعي</span>}
        </div>

        {/* ---- study ---- */}
        {task.kind === "study" && (
          <>
            {progress && (
              <div className="field">
                <ProgressBar
                  percent={progress.percent}
                  label={`${progress.done} من ${progress.total} أجزاء مكتملة — ${progress.percent}%`}
                />
              </div>
            )}
            {(task.companionLabel || effectiveDeadline) && (
              <div className="field">
                <label>{task.companionLabel || "الموعد المساعد"}</label>
                {effectiveDeadline && (
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {formatCountdown(effectiveDeadline, now)}
                  </div>
                )}
              </div>
            )}
            <div className="field">
              <label>أجزاء الدراسة</label>
              <ChecklistEditor
                items={task.parts}
                onChange={(items) => setChecklist(task.id, items)}
                placeholder="أضف جزء..."
              />
            </div>
          </>
        )}

        {/* ---- event ---- */}
        {task.kind === "event" && (
          <>
            {effectiveDeadline && (
              <div className="field">
                <label>الوقت المتبقي</label>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{formatCountdown(effectiveDeadline, now)}</div>
                <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
                  {formatDeadlineDate(effectiveDeadline)}
                </div>
              </div>
            )}
            {task.location && (
              <div className="field">
                <label>المكان / الرابط</label>
                <div style={{ fontSize: 12.5 }}>{task.location}</div>
              </div>
            )}
            <label className="checkbox-row" onClick={() => toggleAttended(task.id)}>
              <input type="checkbox" checked={task.attended} readOnly />
              حضرت
            </label>
            {task.steps.length > 0 && (
              <div className="field">
                <label>خطوات إضافية</label>
                <ChecklistEditor
                  items={task.steps}
                  onChange={(items) => setChecklist(task.id, items)}
                  placeholder="أضف خطوة..."
                />
              </div>
            )}
          </>
        )}

        {/* ---- recurring ---- */}
        {task.kind === "recurring" && (
          <>
            <div className="field">
              <label>الموعد الأسبوعي</label>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {task.dayOfWeek !== null ? WEEKDAYS_AR[task.dayOfWeek] : "—"} {task.time ?? ""}
              </div>
              {effectiveDeadline && (
                <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
                  {formatCountdown(effectiveDeadline, now)}
                </div>
              )}
            </div>
            <label className="checkbox-row" onClick={() => toggleDoneToday(task.id)}>
              <input type="checkbox" checked={isDoneForCurrentCycle(task, new Date(now))} readOnly />
              تم اليوم
            </label>
          </>
        )}

        {/* ---- opportunity ---- */}
        {task.kind === "opportunity" && (
          <>
            {effectiveDeadline && (
              <div className="field">
                <label>الوقت المتبقي</label>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{formatCountdown(effectiveDeadline, now)}</div>
                <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
                  {formatDeadlineDate(effectiveDeadline)}
                </div>
              </div>
            )}
            {progress && (
              <div className="field">
                <ProgressBar
                  percent={progress.percent}
                  label={`${progress.done} من ${progress.total} خطوات — ${progress.percent}%`}
                />
              </div>
            )}
            <div className="field">
              <label>Checklist</label>
              <ChecklistEditor
                items={task.checklist}
                onChange={(items) => setChecklist(task.id, items)}
                placeholder="أضف خطوة..."
              />
            </div>
          </>
        )}

        {/* ---- project ---- */}
        {task.kind === "project" && (
          <>
            {progress && (
              <div className="field">
                <ProgressBar
                  percent={progress.percent}
                  label={`${progress.done} من ${progress.total} مراحل — ${progress.percent}%`}
                />
              </div>
            )}
            {effectiveDeadline && (
              <div className="field">
                <label>الموعد النهائي</label>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{formatCountdown(effectiveDeadline, now)}</div>
              </div>
            )}
            <div className="field">
              <label>مراحل المشروع</label>
              <ChecklistEditor
                items={task.phases}
                onChange={(items) => setChecklist(task.id, items)}
                placeholder="أضف مرحلة..."
              />
            </div>
          </>
        )}

        {/* ---- simple ---- */}
        {task.kind === "simple" && effectiveDeadline && (
          <div className="field">
            <label>الوقت المتبقي</label>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{formatCountdown(effectiveDeadline, now)}</div>
          </div>
        )}

        {task.why && (
          <div className="motivation-box">
            <div className="label">{task.kind === "opportunity" ? "ليش أبي أقدم؟" : "ليش لازم أسويها؟"}</div>
            <p className="why-text">{task.why}</p>
            <button className="btn primary" style={{ width: "100%" }} onClick={onOpenMotivation}>
              مالي خلق 😩
            </button>
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
