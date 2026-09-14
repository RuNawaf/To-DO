import { useState } from "react";
import {
  CATEGORIES,
  WEEKDAYS_AR,
  kindForCategory,
  type Category,
  type ChecklistItem,
  type NewTaskInput,
  type Priority,
  type Task,
} from "../../shared/types";
import { PRIORITY_META } from "../utils/category";
import ChecklistEditor from "./ChecklistEditor";

const STUDY_PRESETS = ["Chapter 1", "Chapter 2", "حل الأسئلة", "مراجعة الملخص", "اختبار تجريبي"];
const OPPORTUNITY_PRESETS = [
  "قراءة الشروط",
  "تجهيز السيرة",
  "كتابة الإجابات",
  "تصوير الفيديو",
  "رفع الملفات",
  "إرسال الطلب",
];
const PROJECT_PRESETS = ["التخطيط", "الجزء الأول", "الجزء الثاني", "المراجعة", "التسليم"];

interface Props {
  initial?: Task | null;
  defaultCategory?: Category;
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

function toIso(local: string): string | null {
  return local ? new Date(local).toISOString() : null;
}

export default function TaskFormModal({ initial, defaultCategory, onCancel, onSave }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<Category>(
    initial?.category ?? defaultCategory ?? "دراسة"
  );
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [why, setWhy] = useState(initial?.why ?? "");
  const [smallestStep, setSmallestStep] = useState(initial?.smallestStep ?? "");

  // study
  const [parts, setParts] = useState<ChecklistItem[]>(initial?.kind === "study" ? initial.parts : []);
  const [companionLabel, setCompanionLabel] = useState(
    initial?.kind === "study" ? initial.companionLabel : ""
  );
  const [companionDateLocal, setCompanionDateLocal] = useState(
    initial?.kind === "study" ? toLocalInputValue(initial.companionDate) : ""
  );

  // event
  const [eventDateLocal, setEventDateLocal] = useState(
    initial?.kind === "event" ? toLocalInputValue(initial.dateTime) : ""
  );
  const [location, setLocation] = useState(initial?.kind === "event" ? initial.location : "");
  const [steps, setSteps] = useState<ChecklistItem[]>(initial?.kind === "event" ? initial.steps : []);

  // recurring
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(
    initial?.kind === "recurring" ? initial.dayOfWeek : new Date().getDay()
  );
  const [time, setTime] = useState(initial?.kind === "recurring" ? initial.time ?? "20:00" : "20:00");
  const [recurringWeekly, setRecurringWeekly] = useState(
    initial?.kind === "recurring" ? initial.recurring : true
  );

  // opportunity
  const [oppDeadlineLocal, setOppDeadlineLocal] = useState(
    initial?.kind === "opportunity" ? toLocalInputValue(initial.deadline) : ""
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    initial?.kind === "opportunity" ? initial.checklist : []
  );

  // project
  const [phases, setPhases] = useState<ChecklistItem[]>(
    initial?.kind === "project" ? initial.phases : []
  );
  const [projDeadlineLocal, setProjDeadlineLocal] = useState(
    initial?.kind === "project" ? toLocalInputValue(initial.deadline) : ""
  );
  const [deadlineRequired, setDeadlineRequired] = useState(
    initial?.kind === "project" ? initial.deadlineRequired : false
  );

  // simple
  const [simpleDeadlineLocal, setSimpleDeadlineLocal] = useState(
    initial?.kind === "simple" ? toLocalInputValue(initial.deadline) : ""
  );

  const kind = kindForCategory(category);

  const canSave =
    title.trim().length > 0 &&
    (kind !== "opportunity" || oppDeadlineLocal !== "") &&
    (kind !== "recurring" || (dayOfWeek !== null && time !== "")) &&
    (kind !== "event" || eventDateLocal !== "") &&
    (kind !== "project" || !deadlineRequired || projDeadlineLocal !== "");

  function handleSave() {
    if (!canSave) return;

    const common = {
      title: title.trim(),
      category,
      priority,
      why: why.trim(),
      smallestStep: smallestStep.trim(),
      notes: initial?.notes ?? [],
      snoozedUntil: initial?.snoozedUntil ?? null,
    };

    let input: NewTaskInput;
    switch (kind) {
      case "study":
        input = {
          ...common,
          kind,
          parts,
          companionLabel: companionLabel.trim(),
          companionDate: toIso(companionDateLocal),
        };
        break;
      case "event":
        input = {
          ...common,
          kind,
          dateTime: toIso(eventDateLocal),
          location: location.trim(),
          attended: initial?.kind === "event" ? initial.attended : false,
          steps,
        };
        break;
      case "recurring":
        input = {
          ...common,
          kind,
          dayOfWeek,
          time: time || null,
          recurring: recurringWeekly,
          doneMarkedAt: initial?.kind === "recurring" ? initial.doneMarkedAt : null,
        };
        break;
      case "opportunity":
        input = {
          ...common,
          kind,
          deadline: toIso(oppDeadlineLocal),
          checklist,
        };
        break;
      case "project":
        input = {
          ...common,
          kind,
          phases,
          deadline: toIso(projDeadlineLocal),
          deadlineRequired,
        };
        break;
      case "simple":
      default:
        input = {
          ...common,
          kind: "simple",
          deadline: toIso(simpleDeadlineLocal),
        };
        break;
    }

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
            placeholder="مثال: Biology Exam"
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

        {kind === "study" && (
          <>
            <div className="field">
              <label>أجزاء الدراسة</label>
              <ChecklistEditor items={parts} onChange={setParts} presets={STUDY_PRESETS} placeholder="أضف جزء..." />
            </div>
            <div className="field">
              <label>موعد مساعد (اختياري) — لا يُلزمك، فقط يرتب الأولوية</label>
              <input
                value={companionLabel}
                onChange={(e) => setCompanionLabel(e.target.value)}
                placeholder='مثال: "الاختبار يوم الخميس"'
              />
            </div>
            <div className="field">
              <label>تاريخ الموعد المساعد (اختياري)</label>
              <input
                type="datetime-local"
                value={companionDateLocal}
                onChange={(e) => setCompanionDateLocal(e.target.value)}
              />
            </div>
          </>
        )}

        {kind === "event" && (
          <>
            <div className="field">
              <label>التاريخ والوقت</label>
              <input
                type="datetime-local"
                value={eventDateLocal}
                onChange={(e) => setEventDateLocal(e.target.value)}
              />
            </div>
            <div className="field">
              <label>المكان أو الرابط</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="قاعة B12 أو رابط Zoom"
              />
            </div>
            <div className="field">
              <label>خطوات إضافية (اختياري)</label>
              <ChecklistEditor items={steps} onChange={setSteps} placeholder="أضف خطوة..." />
            </div>
          </>
        )}

        {kind === "recurring" && (
          <>
            <div className="inline-fields">
              <div className="field">
                <label>اليوم</label>
                <select
                  value={dayOfWeek ?? ""}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                >
                  {WEEKDAYS_AR.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>الوقت</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={recurringWeekly}
                onChange={(e) => setRecurringWeekly(e.target.checked)}
              />
              يتكرر أسبوعيًا
            </label>
          </>
        )}

        {kind === "opportunity" && (
          <>
            <div className="field">
              <label>آخر موعد للتقديم</label>
              <input
                type="datetime-local"
                value={oppDeadlineLocal}
                onChange={(e) => setOppDeadlineLocal(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Checklist</label>
              <ChecklistEditor
                items={checklist}
                onChange={setChecklist}
                presets={OPPORTUNITY_PRESETS}
                placeholder="أضف خطوة..."
              />
            </div>
          </>
        )}

        {kind === "project" && (
          <>
            <div className="field">
              <label>مراحل المشروع</label>
              <ChecklistEditor items={phases} onChange={setPhases} presets={PROJECT_PRESETS} placeholder="أضف مرحلة..." />
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={deadlineRequired}
                onChange={(e) => setDeadlineRequired(e.target.checked)}
              />
              الموعد النهائي إلزامي
            </label>
            <div className="field">
              <label>الموعد النهائي {deadlineRequired ? "" : "(اختياري)"}</label>
              <input
                type="datetime-local"
                value={projDeadlineLocal}
                onChange={(e) => setProjDeadlineLocal(e.target.value)}
              />
            </div>
          </>
        )}

        {kind === "simple" && (
          <div className="field">
            <label>موعد نهائي (اختياري)</label>
            <input
              type="datetime-local"
              value={simpleDeadlineLocal}
              onChange={(e) => setSimpleDeadlineLocal(e.target.value)}
            />
          </div>
        )}

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
          <label>{kind === "opportunity" ? "ليش أبي أقدم؟" : "ليش لازم أسويها؟ (اختياري)"}</label>
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
