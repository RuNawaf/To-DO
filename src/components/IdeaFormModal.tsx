import { useState } from "react";
import type { NewIdeaInput } from "../../shared/types";

interface Props {
  onCancel: () => void;
  onSave: (input: NewIdeaInput) => void;
}

export default function IdeaFormModal({ onCancel, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [timeLocal, setTimeLocal] = useState("");
  const [description, setDescription] = useState("");

  const canSave = title.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      time: timeLocal ? new Date(timeLocal).toISOString() : null,
      description: description.trim(),
    });
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>فكرة جديدة</h2>

        <div className="field">
          <label>عنوان الفكرة</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="مثال: تعلّم تصوير Reels"
          />
        </div>

        <div className="field">
          <label>التاريخ والوقت (اختياري)</label>
          <input
            type="datetime-local"
            value={timeLocal}
            onChange={(e) => setTimeLocal(e.target.value)}
          />
        </div>

        <div className="field">
          <label>وصف (اختياري)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="تفاصيل بسيطة عن الفكرة..."
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
