import { useState, useEffect } from "react";
import {
  Mountain,
  Radio,
  Satellite,
  Camera,
  MapPin,
  Globe2,
  Sliders,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Header({
  lastSync,
  live,
  source,
  onOpenGeotagModal,
  onOpenReportsModal,
  onOpenBroadcastModal,
  onOpenSimulationModal,
  reportCount = 0,
  lowBandwidth = false,
  onToggleLowBandwidth,
}) {
  const { lang, setLang, t, languages } = useLanguage();
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex flex-wrap items-center justify-between border-b border-line bg-panel-2 px-4 py-3 sm:px-6 gap-3">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal/15 text-teal ring-1 ring-teal/30 shadow-md">
          <Mountain size={22} strokeWidth={2.2} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-lg font-bold tracking-tight text-ink">
              {t("title")}
            </h1>
            <span className="rounded bg-teal/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-teal ring-1 ring-teal/30">
              AI-NER-v2.4
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-faint font-mono">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Center / Status Bar */}
      <div className="hidden xl:flex items-center gap-4 text-xs font-mono text-muted">
        {/* Live IST Clock */}
        <div className="flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1">
          <Clock size={12} className="text-teal" />
          <span className="text-ink font-semibold">{currentTime} IST</span>
        </div>

        {/* Telemetry link */}
        <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1">
          <Satellite size={13} className={live ? "text-teal" : "text-amber"} />
          <span className="text-[11px]">
            {live ? t("liveFeed") : t("fallbackMode")}
          </span>
        </div>

        {/* Bandwidth Mode Switcher */}
        <button
          type="button"
          onClick={onToggleLowBandwidth}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 transition cursor-pointer ${
            lowBandwidth
              ? "border-amber/40 bg-amber/15 text-amber"
              : "border-line bg-panel text-muted hover:text-ink"
          }`}
          title="Toggle Low-Bandwidth Mode for remote areas with 2G/poor signal"
        >
          {lowBandwidth ? <WifiOff size={12} /> : <Wifi size={12} />}
          <span className="text-[11px]">
            {lowBandwidth ? t("lowBandwidth") : t("normalBandwidth")}
          </span>
        </button>
      </div>

      {/* Right Controls & Action Hub */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Multilingual Selector */}
        <div className="flex items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 py-1 text-xs">
          <Globe2 size={14} className="text-teal" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-transparent text-xs font-medium text-ink focus:outline-none cursor-pointer"
          >
            {Object.values(languages).map((l) => (
              <option key={l.code} value={l.code} className="bg-panel text-ink">
                {l.native} ({l.label})
              </option>
            ))}
          </select>
        </div>

        {/* What-If Simulator Button */}
        <button
          type="button"
          onClick={onOpenSimulationModal}
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-medium text-muted hover:border-teal/40 hover:text-ink transition cursor-pointer"
          title="Simulate cloudburst & slope failure scenarios"
        >
          <Sliders size={14} className="text-teal" />
          <span>{t("whatIfSim")}</span>
        </button>

        {/* Field Reports Badge Button */}
        <button
          type="button"
          onClick={onOpenReportsModal}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 py-1.5 text-xs font-medium text-muted hover:border-teal/40 hover:text-ink transition cursor-pointer"
          title="Browse captured geotagged field reports"
        >
          <MapPin size={14} className="text-teal" />
          <span className="hidden md:inline">{t("fieldIntel")}</span>
          <span className="rounded-full bg-teal/15 px-1.5 py-0.2 font-mono text-[10px] text-teal font-bold">
            {reportCount}
          </span>
        </button>

        {/* Geotag Capture Photo Button */}
        <button
          type="button"
          onClick={onOpenGeotagModal}
          className="flex items-center gap-1.5 rounded-lg bg-teal px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90 active:scale-95 transition cursor-pointer"
          title="Capture photo with live GPS geotag & coordinate telemetry"
        >
          <Camera size={14} />
          <span className="hidden sm:inline">{t("captureGeotag")}</span>
        </button>

        {/* Broadcast Alert Button */}
        <button
          type="button"
          onClick={onOpenBroadcastModal}
          className="flex items-center gap-1.5 rounded-lg bg-risk-critical/90 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-risk-critical/20 hover:bg-risk-critical active:scale-95 transition cursor-pointer"
          title="Dispatch Common Alerting Protocol (CAP) emergency alert"
        >
          <Radio size={14} />
          <span className="hidden md:inline">{t("broadcastAlert")}</span>
        </button>
      </div>
    </header>
  );
}
