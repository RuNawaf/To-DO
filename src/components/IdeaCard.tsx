import { useTaskStore } from "../store/useTaskStore";
import type { Idea } from "../../shared/types";
import { formatDeadlineDate } from "../utils/countdown";
import { useConfirmAction } from "../hooks";

function formatIdeaTime(time: string): string {
  // Legacy ideas stored a bare "HH:mm"; new ones store a full ISO date+time.
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    const [hh, mm] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d.toLocaleTimeString("ar-SA-u-ca-gregory", { hour: "2-digit", minute: "2-digit" });
  }
  return formatDeadlineDate(time);
}

interface Props {
  idea: Idea;
}

export default function IdeaCard({ idea }: Props) {
  const toggleIdeaDone = useTaskStore((s) => s.toggleIdeaDone);
  const deleteIdea = useTaskStore((s) => s.deleteIdea);
  const [confirmingDelete, triggerDelete] = useConfirmAction(() => deleteIdea(idea.id));

  return (
    <div className={`idea-card${idea.done ? " done" : ""}`}>
      <button
        className={`idea-check${idea.done ? " done" : ""}`}
        title={idea.done ? "إرجاع للنشطة" : "تم"}
        onClick={() => toggleIdeaDone(idea.id)}
      >
        {idea.done ? "✓" : ""}
      </button>
      <div className="idea-body">
        <div className={`idea-title${idea.done ? " done" : ""}`}>{idea.title}</div>
        {idea.description && <div className="idea-description">{idea.description}</div>}
        {idea.time && <div className="idea-time">🕐 {formatIdeaTime(idea.time)}</div>}
      </div>
      <button
        className={`idea-delete${confirmingDelete ? " confirming" : ""}`}
        title={confirmingDelete ? "اضغط مرة ثانية للتأكيد" : "حذف الفكرة"}
        onClick={triggerDelete}
      >
        {confirmingDelete ? "تأكيد؟" : "✕"}
      </button>
    </div>
  );
}
