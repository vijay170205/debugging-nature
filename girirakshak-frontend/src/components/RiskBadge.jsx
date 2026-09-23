import { RISK_LEVELS } from "../data/riskZones";

export default function RiskBadge({ level, size = "sm" }) {
  const info = RISK_LEVELS[level] ?? RISK_LEVELS.low;
  const sizeClasses = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium tracking-wide uppercase ${sizeClasses}`}
      style={{ backgroundColor: `${info.color}1A`, color: info.color, border: `1px solid ${info.color}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: info.color }} />
      {info.label}
    </span>
  );
}
