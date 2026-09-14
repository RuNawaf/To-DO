import { useEffect, useRef, useState } from "react";
import type { Task } from "../../shared/types";
import { formatCountdown } from "../utils/countdown";
import { useNow } from "../hooks";

interface Props {
  task: Task;
  onClose: () => void;
}

const START_SECONDS = 10 * 60;

export default function MotivationModal({ task, onClose }: Props) {
  const now = useNow(5000);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(START_SECONDS);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>مالي خلق 😩</h2>

        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginBottom: 6 }}>
          {task.title} · {formatCountdown(task.deadline, now)}
        </div>

        {task.why && (
          <div className="motivation-box">
            <div className="label">أنت كتبت لنفسك:</div>
            <p className="why-text">"{task.why}"</p>
          </div>
        )}

        <p style={{ fontSize: 12.5, color: "var(--fg-muted)", margin: "0 0 6px" }}>
          لا تحتاج تخلص كل شيء الآن. ابدأ فقط بـ:
        </p>

        <div className="motivation-box" style={{ marginBottom: 4 }}>
          <p className="step-text">{task.smallestStep || "افتح المهمة وسوِّ أي خطوة بسيطة الآن."}</p>
        </div>

        {running || finished ? (
          <>
            <div className="timer-display">{finished ? "🎉 وقتك خلص!" : `${mm}:${ss}`}</div>
            {finished ? (
              <p style={{ fontSize: 12, textAlign: "center", color: "var(--fg-muted)" }}>
                شغلت 10 دقائق. كملها لو عندك حماس، أو خذ استراحة وارجع.
              </p>
            ) : (
              <p style={{ fontSize: 11.5, textAlign: "center", color: "var(--fg-muted)" }}>
                عيونك على المهمة، مو على المؤقت.
              </p>
            )}
          </>
        ) : null}

        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            إغلاق
          </button>
          {!running && !finished && (
            <button className="btn primary" onClick={() => setRunning(true)}>
              ابدأ 10 دقائق
            </button>
          )}
          {finished && (
            <button className="btn primary" onClick={onClose}>
              تم، أكمل المهمة
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
