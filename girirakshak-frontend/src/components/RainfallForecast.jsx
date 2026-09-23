import { CloudRain } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function RainfallForecast({ data = [] }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-line bg-panel p-3.5 shadow-sm">
      <div className="flex items-center justify-between border-b border-line pb-2 mb-2.5">
        <h2 className="font-display text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
          <CloudRain size={14} className="text-teal" />
          {t("rainfallForecast")}
        </h2>
        <span className="font-mono text-[10px] text-faint">IMD Grid Synced</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {data.map((item, i) => {
          const isHeavy = item.mm >= 100;
          const isModerate = item.mm >= 50 && item.mm < 100;
          const alertColor = isHeavy ? "#e0483f" : isModerate ? "#d97f36" : "#2a9d8f";

          return (
            <div
              key={i}
              className="rounded-lg border border-line bg-panel-2 p-2.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-semibold text-ink">{item.day}</span>
                <span
                  className="rounded px-1 py-0.2 font-mono text-[9px] font-bold"
                  style={{ backgroundColor: `${alertColor}22`, color: alertColor }}
                >
                  {item.alert || (isHeavy ? "Red" : isModerate ? "Orange" : "Green")}
                </span>
              </div>

              <div className="my-1 text-center">
                <span className="font-display text-lg font-bold text-ink">{item.mm}</span>
                <span className="font-mono text-[10px] text-faint ml-1">mm</span>
              </div>

              <p className="text-[9px] text-muted text-center font-mono truncate">
                {item.condition || (isHeavy ? "Extreme Deluge" : "Intermittent")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
