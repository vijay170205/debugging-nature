import { Bell } from "lucide-react";
import { RISK_LEVELS } from "../data/riskZones";
import { useLanguage } from "../context/LanguageContext";

export default function AlertsPanel({ alerts = [], zones = [] }) {
  const { t } = useLanguage();
  const zoneById = Object.fromEntries(zones.map((z) => [z.id, z]));

  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 bg-panel-2">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xs font-bold text-ink uppercase tracking-wider">
            {t("liveAlertFeed")}
          </h2>
          <span className="h-2 w-2 rounded-full bg-risk-critical animate-ping" />
        </div>
        <Bell size={14} className="text-faint" />
      </div>

      <div className="flex-1 divide-y divide-line overflow-y-auto">
        {alerts.map((alert) => {
          const info = RISK_LEVELS[alert.severity] || RISK_LEVELS.moderate;
          const zone = zoneById[alert.zoneId];

          return (
            <div key={alert.id} className="p-3 hover:bg-panel-2/50 transition space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-snug text-ink">{alert.message}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-faint">
                    <span className="text-teal font-semibold">{zone?.name ? zone.name.split("–")[0] : alert.state || "NER Grid"}</span>
                    <span>•</span>
                    <span>{alert.time}</span>
                  </div>

                  {alert.channels && alert.channels.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {alert.channels.map((ch) => (
                        <span
                          key={ch}
                          className="rounded bg-panel border border-line px-1.5 py-0.2 font-mono text-[8px] text-muted"
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
