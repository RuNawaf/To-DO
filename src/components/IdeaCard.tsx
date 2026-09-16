import { useTaskStore } from "../store/useTaskStore";
import type { Idea } from "../../shared/types";

function formatTime(time: string): string {
  const [hh, mm] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  idea: Idea;
}

export default function IdeaCard({ idea }: Props) {
  const toggleIdeaDone = useTaskStore((s) => s.toggleIdeaDone);

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
        {idea.time && <div className="idea-time">🕐 {formatTime(idea.time)}</div>}
      </div>
    </div>
  );
}
