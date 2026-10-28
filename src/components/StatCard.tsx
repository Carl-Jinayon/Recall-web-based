import { Icon, type IconName } from "./Icon";

interface StatCardProps {
  icon: IconName;
  label: string;
  value: number | string;
  note: string;
  tone?: "accent" | "warning" | "neutral";
}

export function StatCard({
  icon,
  label,
  value,
  note,
  tone = "neutral",
}: StatCardProps) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <span className="stat-icon">
        <Icon name={icon} size={18} />
      </span>
      <div>
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        <span className="stat-note">{note}</span>
      </div>
    </div>
  );
}
