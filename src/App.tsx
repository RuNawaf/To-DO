import { useEffect, useMemo, useState } from "react";
import { sortedIdeas, sortedVisibleTasks, useTaskStore } from "./store/useTaskStore";
import TitleBar from "./components/TitleBar";
import TaskCard from "./components/TaskCard";
import TaskFormModal from "./components/TaskFormModal";
import TaskDetailModal from "./components/TaskDetailModal";
import MotivationModal from "./components/MotivationModal";
import SettingsPanel from "./components/SettingsPanel";
import IdeaCard from "./components/IdeaCard";
import IdeaFormModal from "./components/IdeaFormModal";
import { useIdle, useNow } from "./hooks";
import { urgencyOf } from "./utils/countdown";
import { getEffectiveDeadline } from "../shared/taskLogic";

type ModalState =
  | { type: "none" }
  | { type: "add" }
  | { type: "edit"; taskId: string }
  | { type: "detail"; taskId: string; focusNote?: boolean }
  | { type: "motivation"; taskId: string }
  | { type: "addIdea" }
  | { type: "settings" };

export default function App() {
  const { tasks, ideas, settings, loaded, init, addTask, editTask, addIdea } = useTaskStore();
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
    () =>
      visibleTasks.filter((t) =>
        ["overdue", "critical"].includes(urgencyOf(getEffectiveDeadline(t, new Date(now)), now))
      ),
    [visibleTasks, now]
  );
  const upcomingTasks = useMemo(
    () =>
      visibleTasks.filter(
        (t) => !["overdue", "critical"].includes(urgencyOf(getEffectiveDeadline(t, new Date(now)), now))
      ),
    [visibleTasks, now]
  );

  const visibleIdeas = useMemo(() => sortedIdeas(ideas), [ideas]);

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

      <div className="sections-grid">
        <div className="section-column commitments-section">
          <div className="section-header">الالتزامات</div>
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
        </div>

        <div className="section-column idea-section">
          <div className="section-header">أفكار</div>
          <div className="idea-list">
            {visibleIdeas.length === 0 && (
              <div className="empty-state">
                لا أفكار محفوظة بعد 💡
                <br />
                دوّن أي فكرة تخطر ببالك.
              </div>
            )}
            {visibleIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
          <div className="add-bar">
            <button className="add-btn" onClick={() => setModal({ type: "addIdea" })}>
              + إضافة فكرة
            </button>
          </div>
        </div>
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
            editTask(activeTask.id, input);
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

      {modal.type === "addIdea" && (
        <IdeaFormModal
          onCancel={() => setModal({ type: "none" })}
          onSave={(input) => {
            addIdea(input);
            setModal({ type: "none" });
          }}
        />
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
