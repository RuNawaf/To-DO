import { useTaskStore } from "../store/useTaskStore";
import type { ThemeMode } from "../../shared/types";

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="track" />
    </label>
  );
}

export default function SettingsPanel() {
  const settings = useTaskStore((s) => s.settings);
  const updateSettings = useTaskStore((s) => s.updateSettings);

  return (
    <div className="settings-panel">
      <div className="setting-row">
        <div>
          <div>تثبيت فوق النوافذ دائمًا</div>
          <div className="desc">Always on Top</div>
        </div>
        <Switch checked={settings.alwaysOnTop} onChange={(v) => updateSettings({ alwaysOnTop: v })} />
      </div>

      <div className="setting-row">
        <div>
          <div>تشغيل تلقائي عند بدء الجهاز</div>
          <div className="desc">Launch on startup</div>
        </div>
        <Switch checked={settings.autoStart} onChange={(v) => updateSettings({ autoStart: v })} />
      </div>

      <div className="setting-row">
        <div>
          <div>الوضع المصغّر افتراضيًا</div>
          <div className="desc">Compact by default</div>
        </div>
        <Switch checked={settings.compact} onChange={(v) => updateSettings({ compact: v })} />
      </div>

      <div className="setting-row">
        <div>
          <div>قفل الموضع (منع السحب بالخطأ)</div>
          <div className="desc">Lock position</div>
        </div>
        <Switch checked={settings.locked} onChange={(v) => updateSettings({ locked: v })} />
      </div>

      <div className="field">
        <label>المظهر</label>
        <select
          value={settings.theme}
          onChange={(e) => updateSettings({ theme: e.target.value as ThemeMode })}
        >
          <option value="system">حسب النظام</option>
          <option value="light">فاتح</option>
          <option value="dark">داكن</option>
        </select>
      </div>

      <div className="field">
        <label>الشفافية عند عدم الاستخدام: {Math.round(settings.idleOpacity * 100)}%</label>
        <input
          type="range"
          min={0.2}
          max={1}
          step={0.05}
          value={settings.idleOpacity}
          onChange={(e) => updateSettings({ idleOpacity: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
