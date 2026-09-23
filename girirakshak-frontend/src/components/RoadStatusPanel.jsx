import { Construction, Navigation, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { vulnerableRoads } from "../data/riskZones";
import { useLanguage } from "../context/LanguageContext";

export default function RoadStatusPanel({ zones = [] }) {
  const { t } = useLanguage();

  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-panel-2">
        <h2 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
          {t("roadConnectivity")}
        </h2>
        <Construction size={14} className="text-faint" />
      </div>

      <div className="flex-1 divide-y divide-line overflow-y-auto">
        {vulnerableRoads.map((road) => {
          const isBlocked = road.status === "blocked";
          const isAtRisk = road.status === "at-risk";

          return (
            <div key={road.id} className="p-3 hover:bg-panel-2/40 transition space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-xs text-ink truncate">{road.name}</span>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                    isBlocked
                      ? "bg-risk-critical/15 text-risk-critical border border-risk-critical/30"
                      : isAtRisk
                      ? "bg-risk-high/15 text-risk-high border border-risk-high/30"
                      : "bg-risk-low/15 text-risk-low border border-risk-low/30"
                  }`}
                >
                  {road.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-faint">
                <span>{road.state} • {road.agency}</span>
                {isBlocked && (
                  <span className="text-risk-critical font-semibold flex items-center gap-1">
                    <Clock size={10} /> ETA: {road.estimatedClearanceHours}h
                  </span>
                )}
              </div>

              {road.detour && (
                <div className="rounded bg-panel-2 p-1.5 text-[10px] text-muted font-mono flex items-start gap-1 border border-line/60">
                  <Navigation size={11} className="text-teal shrink-0 mt-0.5" />
                  <span className="truncate">Detour: {road.detour}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
