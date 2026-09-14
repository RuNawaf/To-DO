interface Props {
  percent: number;
  label?: string;
}

export default function ProgressBar({ percent, label }: Props) {
  return (
    <div className="progress-wrap">
      {label && <div className="progress-label">{label}</div>}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
    </div>
  );
}
