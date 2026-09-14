import { useState } from "react";
import type { ChecklistItem } from "../../shared/types";

function uid(): string {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

interface Props {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  presets?: string[];
  placeholder?: string;
}

export default function ChecklistEditor({ items, onChange, presets, placeholder }: Props) {
  const [draft, setDraft] = useState("");

  function addItem(title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    onChange([...items, { id: uid(), title: trimmed, done: false }]);
    setDraft("");
  }

  const unusedPresets = (presets ?? []).filter(
    (p) => !items.some((i) => i.title === p)
  );

  return (
    <div className="checklist-editor">
      {items.map((item) => (
        <div className="subtask-row" key={item.id}>
          <span
            style={{ cursor: "pointer" }}
            onClick={() =>
              onChange(items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))
            }
          >
            {item.done ? "☑" : "☐"}
          </span>
          <span className={item.done ? "subtask-done" : ""}>{item.title}</span>
          <button
            className="icon-btn danger"
            onClick={() => onChange(items.filter((i) => i.id !== item.id))}
          >
            ✕
          </button>
        </div>
      ))}

      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem(draft)}
          placeholder={placeholder ?? "أضف عنصر..."}
        />
        <button
          className="btn ghost"
          style={{ flex: "0 0 auto", padding: "0 12px" }}
          onClick={() => addItem(draft)}
        >
          +
        </button>
      </div>

      {unusedPresets.length > 0 && (
        <div className="preset-chips">
          {unusedPresets.map((p) => (
            <button key={p} type="button" className="preset-chip" onClick={() => addItem(p)}>
              + {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
