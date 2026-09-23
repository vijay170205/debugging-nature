import {
  AlertTriangle,
  MapPinned,
  Users,
  Construction,
  Radio,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

function StatCard({ icon: Icon, label, value, tone, subtitle }) {
  return (
    <div className="flex-1 min-w-[170px] rounded-xl border border-line bg-panel p-3.5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.1em] text-faint font-mono">{label}</span>
        <Icon size={16} className={tone} />
      </div>
      <p className="mt-1.5 font-display text-2xl font-bold text-ink">{value}</p>
      {subtitle && <p className="mt-0.5 text-[10px] text-muted font-mono">{subtitle}</p>}
    </div>
  );
}

export default function StatCards({ summary }) {
  const { t } = useLanguage();
  if (!summary) return null;

  return (
    <div className="flex flex-wrap gap-3">
      <StatCard
        icon={MapPinned}
        label={t("monitoredZones")}
        value={summary.totalZones || 9}
        tone="text-teal"
        subtitle="8 NER States active"
      />
      <StatCard
        icon={AlertTriangle}
        label={t("criticalZones")}
        value={summary.critical || 2}
        tone="text-risk-critical"
        subtitle="Evacuation alert active"
      />
      <StatCard
        icon={Construction}
        label={t("roadsBlocked")}
        value={`${summary.roadsBlocked || 2} / ${summary.roadsAtRisk || 2}`}
        tone="text-risk-high"
        subtitle="Clearance in progress"
      />
      <StatCard
        icon={Users}
        label={t("populationAtRisk")}
        value={(summary.populationAtRisk || 43600).toLocaleString("en-IN")}
        tone="text-amber"
        subtitle="In high-hazard sectors"
      />
      <StatCard
        icon={Radio}
        label={t("activeSensors")}
        value={summary.activeSensors || 4}
        tone="text-teal"
        subtitle="IoT & GNSS telemetry"
      />
      <StatCard
        icon={ShieldCheck}
        label={t("readinessIndex")}
        value={`${summary.readinessScore || 88}%`}
        tone="text-risk-low"
        subtitle="NDRF & SDRF standby"
      />
    </div>
  );
}
