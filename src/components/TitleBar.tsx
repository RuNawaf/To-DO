interface Props {
  compact: boolean;
  onToggleCompact: () => void;
  onOpenSettings: () => void;
  onMinimize: () => void;
}

export default function TitleBar({ compact, onToggleCompact, onOpenSettings, onMinimize }: Props) {
  return (
    <div className="titlebar">
      <div className="brand">
        <span className="dot" />
        <span>التزاماتي</span>
      </div>
      <div className="titlebar-actions">
        <button className="icon-btn" title={compact ? "توسيع" : "تصغير"} onClick={onToggleCompact}>
          {compact ? "⤢" : "⤡"}
        </button>
        <button className="icon-btn" title="الإعدادات" onClick={onOpenSettings}>
          ⚙
        </button>
        <button className="icon-btn" title="إخفاء" onClick={onMinimize}>
          ─
        </button>
      </div>
    </div>
  );
}
