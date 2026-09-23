import RiskBadge from "./RiskBadge";
import { useLanguage } from "../context/LanguageContext";

export default function RiskZonesList({ zones = [], selectedZoneId, onSelectZone }) {
  const { t } = useLanguage();
  const sorted = [...zones].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-panel overflow-hidden">
      <div className="border-b border-line px-4 py-3 bg-panel-2">
        <h2 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
          {t("riskZonesOverview")}
        </h2>
        <p className="text-[10px] text-faint font-mono">Ranked by Hybrid ML & Antecedent Moisture Index</p>
      </div>

      <div className="flex-1 divide-y divide-line overflow-y-auto">
        {sorted.map((zone, i) => (
          <button
            key={zone.id}
            type="button"
            onClick={() => onSelectZone && onSelectZone(zone.id)}
            className={`flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-panel-2 cursor-pointer ${
              zone.id === selectedZoneId ? "bg-panel-2 border-l-2 border-teal" : ""
            }`}
          >
            <span className="mt-0.5 font-mono text-[11px] text-faint font-semibold">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-ink">{zone.name}</p>
              <p className="truncate text-[10px] text-muted">{zone.district ? `${zone.district}, ` : ""}{zone.state}</p>
              <div className="mt-1 flex items-center justify-between">
                <RiskBadge level={zone.riskLevel} />
                <span className="font-mono text-[10px] font-bold text-teal">{zone.riskScore}/100</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
