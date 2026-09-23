import { BrainCircuit } from "lucide-react";

// Turns raw feature keys from the ML service into readable labels.
const FEATURE_LABELS = {
  rainfall_1h: "Rainfall (last 1h)",
  rainfall_24h: "Rainfall (last 24h)",
  rainfall_72h: "Rainfall (last 72h)",
  soil_moisture: "Soil Moisture",
  slope: "Slope Angle",
  elevation: "Elevation",
  historical_density: "Historical Landslide Density",
};

function labelFor(feature) {
  return FEATURE_LABELS[feature] || feature;
}

export default function RiskExplanationPanel({ zone }) {
  const factors = zone?.riskFactors || [];
  const top = [...factors]
    .sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col rounded-xl border border-line bg-panel">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <BrainCircuit size={14} className="text-teal" />
        <h2 className="font-display text-xs font-bold uppercase tracking-wider text-ink">
          Why is this risk score high?
        </h2>
        {zone && (
          <span className="ml-auto truncate text-[10px] text-faint">{zone.name}</span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        {!zone && (
          <p className="text-[12px] text-faint">Select a zone on the map to see its risk explanation.</p>
        )}

        {zone && top.length === 0 && (
          <p className="text-[12px] text-faint">
            No live explanation available yet for this zone — showing static risk score only.
          </p>
        )}

        {top.map((f) => {
          const pushingUp = (f.shapValue ?? 0) >= 0;
          return (
            <div key={f.feature}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-ink">{labelFor(f.feature)}</span>
                <span className={pushingUp ? "text-risk-high font-mono" : "text-risk-low font-mono"}>
                  {pushingUp ? "▲" : "▼"} {f.importance?.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-panel-2">
                <div
                  className={`h-1.5 rounded-full ${pushingUp ? "bg-risk-high" : "bg-risk-low"}`}
                  style={{ width: `${Math.min(100, f.importance ?? 0)}%` }}
                />
              </div>
            </div>
          );
        })}

        {top.length > 0 && (
          <p className="mt-1 text-[10px] text-faint">
            Computed with SHAP (TreeExplainer) — attribution is specific to this zone's current
            readings, not a general feature ranking.
          </p>
        )}
      </div>
    </div>
  );
}
