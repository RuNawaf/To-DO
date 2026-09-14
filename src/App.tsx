import { useEffect, useMemo, useState } from "react";
import { sortedVisibleTasks, useTaskStore } from "./store/useTaskStore";
import TitleBar from "./components/TitleBar";
import TaskCard from "./components/TaskCard";
import TaskFormModal from "./components/TaskFormModal";
import TaskDetailModal from "./components/TaskDetailModal";
import MotivationModal from "./components/MotivationModal";
import SettingsPanel from "./components/SettingsPanel";
import { useIdle, useNow } from "./hooks";
import { urgencyOf } from "./utils/countdown";

type ModalState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; taskId: string }
  | { type: "detail"; taskId: string; focusNote?: boolean }
  | { type: "motivation"; taskId: string }
  | { type: "settings" };

export default function App() {
  const { tasks, settings, loaded, init, addTask, updateTask } = useTaskStore();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const now = useNow(20_000);
  const idle = useIdle(4500);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    window.taskWidget?.toggleCompactSize(settings.compact);
  }, [settings.compact]);

  const visibleTasks = useMemo(() => sortedVisibleTasks(tasks, false), [tasks]);
  const todayTasks = useMemo(
    () => visibleTasks.filter((t) => ["overdue", "critical"].includes(urgencyOf(t.deadline, now))),
    [visibleTasks, now]
  );
  const upcomingTasks = useMemo(
    () => visibleTasks.filter((t) => !["overdue", "critical"].includes(urgencyOf(t.deadline, now))),
    [visibleTasks, now]
  );

  const activeTask = useMemo(() => {
    if (modal.type === "detail" || modal.type === "motivation" || modal.type === "edit") {
      return tasks.find((t) => t.id === modal.taskId) ?? null;
    }
    return null;
  }, [modal, tasks]);

  if (!loaded) return null;

  const compact = settings.compact;

  return (
    <div
      className={`widget${compact ? " compact" : ""}${idle ? " idle" : ""}${settings.locked ? " locked" : ""}`}
      style={{ ["--idle-opacity" as string]: settings.idleOpacity }}
    >
      <TitleBar
        compact={compact}
        onToggleCompact={() => useTaskStore.getState().updateSettings({ compact: !compact })}
        onOpenSettings={() => setModal({ type: "settings" })}
        onMinimize={() => window.taskWidget?.minimize()}
      />

      <div className="task-list">
        {visibleTasks.length === 0 && (
          <div className="empty-state">
            لا توجد مهام الآن 🌤️
            <br />
            أضف أول التزام تبغى تتابعه.
          </div>
        )}

        {!compact && todayTasks.length > 0 && <div className="section-label">اليوم وعاجل</div>}
        {todayTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            now={now}
            compact={compact}
            onOpen={(id) => setModal({ type: "detail", taskId: id })}
            onQuickNote={(id) => setModal({ type: "detail", taskId: id, focusNote: true })}
          />
        ))}

        {!compact && upcomingTasks.length > 0 && todayTasks.length > 0 && (
          <div className="section-label">قادم</div>
        )}
        {upcomingTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            now={now}
            compact={compact}
            onOpen={(id) => setModal({ type: "detail", taskId: id })}
            onQuickNote={(id) => setModal({ type: "detail", taskId: id, focusNote: true })}
          />
        ))}
      </div>

      <div className="add-bar">
        <button className="add-btn" onClick={() => setModal({ type: "add" })}>
          + إضافة مهمة
        </button>
      </div>

      {modal.type === "add" && (
        <TaskFormModal
          onCancel={() => setModal({ type: "none" })}
          onSave={(input) => {
            addTask(input);
            setModal({ type: "none" });
          }}
        />
      )}

      {modal.type === "edit" && activeTask && (
        <TaskFormModal
          initial={activeTask}
          onCancel={() => setModal({ type: "detail", taskId: activeTask.id })}
          onSave={(input) => {
            updateTask(activeTask.id, input);
            setModal({ type: "detail", taskId: activeTask.id });
          }}
        />
      )}

      {modal.type === "detail" && activeTask && (
        <TaskDetailModal
          task={activeTask}
          focusNote={modal.focusNote}
          onClose={() => setModal({ type: "none" })}
          onEdit={() => setModal({ type: "edit", taskId: activeTask.id })}
          onOpenMotivation={() => setModal({ type: "motivation", taskId: activeTask.id })}
        />
      )}

      {modal.type === "motivation" && activeTask && (
        <MotivationModal task={activeTask} onClose={() => setModal({ type: "detail", taskId: activeTask.id })} />
      )}

      {modal.type === "settings" && (
        <div className="modal-overlay" onClick={() => setModal({ type: "none" })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>الإعدادات</h2>
            <SettingsPanel />
            <div className="modal-actions">
              <button className="btn primary" onClick={() => setModal({ type: "none" })}>
                تم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
