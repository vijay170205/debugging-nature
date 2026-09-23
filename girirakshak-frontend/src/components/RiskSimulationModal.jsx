import { useState } from "react";
import {
  X,
  Sliders,
  CloudRain,
  Droplets,
  Mountain,
  TrendingUp,
  RotateCcw,
} from "lucide-react";

export default function RiskSimulationModal({ isOpen, onClose, zones = [] }) {
  // Simulation Inputs
  const [hourlyRain, setHourlyRain] = useState(65); // mm/h
  const [antecedentRain, setAntecedentRain] = useState(280); // mm in 72h
  const [soilMoisture, setSoilMoisture] = useState(82); // %
  const [slopeFactor, setSlopeFactor] = useState(1.2); // geological instability multiplier

  if (!isOpen) return null;

  // Real-time calculation of simulated risk across zones
  const simulatedResults = zones.map((zone) => {
    // Formula: Hybrid index accounting for simulated cloudburst + antecedent moisture + zone slope
    const baselineSlope = zone.slope || 35;
    const slopeMultiplier = (baselineSlope / 35) * slopeFactor;

    const rainScore = Math.min(60, hourlyRain * 0.45 + (antecedentRain / 500) * 35);
    const soilScore = (soilMoisture / 100) * 40;
    const rawScore = Math.round((rainScore + soilScore) * slopeMultiplier);
    const simulatedRiskScore = Math.min(100, Math.max(10, rawScore));

    let simulatedLevel = "low";
    if (simulatedRiskScore >= 80) simulatedLevel = "critical";
    else if (simulatedRiskScore >= 60) simulatedLevel = "high";
    else if (simulatedRiskScore >= 35) simulatedLevel = "moderate";

    const isRoadSevered = simulatedRiskScore >= 75 || zone.roadStatus === "blocked";

    return {
      ...zone,
      simulatedRiskScore,
      simulatedLevel,
      isRoadSevered,
    };
  });

  const criticalCount = simulatedResults.filter((z) => z.simulatedLevel === "critical").length;
  const highCount = simulatedResults.filter((z) => z.simulatedLevel === "high").length;
  const severedRoads = simulatedResults.filter((z) => z.isRoadSevered).length;
  const exposedPopulation = simulatedResults
    .filter((z) => z.simulatedLevel === "critical" || z.simulatedLevel === "high")
    .reduce((acc, z) => acc + (z.population || 0), 0);

  const handleReset = () => {
    setHourlyRain(25);
    setAntecedentRain(120);
    setSoilMoisture(55);
    setSlopeFactor(1.0);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-panel-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/15 text-teal ring-1 ring-teal/30">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
                "What-If" Cloudburst & Slope Failure Scenario Simulator
                <span className="rounded-full bg-teal/15 px-2 py-0.5 font-mono text-[10px] text-teal">
                  AI Physics Engine
                </span>
              </h2>
              <p className="text-[11px] text-muted">
                Simulate extreme precipitation surges to forecast slope collapses and highway severance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="rounded-lg border border-line bg-panel px-2.5 py-1 text-xs text-muted hover:text-ink transition flex items-center gap-1.5 cursor-pointer"
              title="Reset to seasonal average"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-panel hover:text-ink transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slider 1: 1-hour Cloudburst Intensity */}
            <div className="rounded-xl border border-line bg-panel-2 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <CloudRain size={15} className="text-teal" /> 1-Hour Cloudburst Intensity
                </span>
                <span className="font-mono text-sm font-bold text-teal">{hourlyRain} mm/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={hourlyRain}
                onChange={(e) => setHourlyRain(Number(e.target.value))}
                className="w-full accent-teal cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-faint mt-1">
                <span>0 (Dry)</span>
                <span>50 (Heavy)</span>
                <span>100 (Severe)</span>
                <span>150 (Cloudburst)</span>
              </div>
            </div>

            {/* Slider 2: 72-hour Antecedent Rainfall */}
            <div className="rounded-xl border border-line bg-panel-2 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-amber" /> 72-Hour Cumulative Rainfall
                </span>
                <span className="font-mono text-sm font-bold text-amber">{antecedentRain} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="600"
                step="10"
                value={antecedentRain}
                onChange={(e) => setAntecedentRain(Number(e.target.value))}
                className="w-full accent-amber cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-faint mt-1">
                <span>0 mm</span>
                <span>200 mm</span>
                <span>400 mm</span>
                <span>600 mm (Extreme)</span>
              </div>
            </div>

            {/* Slider 3: Soil Moisture Saturation */}
            <div className="rounded-xl border border-line bg-panel-2 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Droplets size={15} className="text-risk-high" /> Sub-surface Soil Saturation
                </span>
                <span className="font-mono text-sm font-bold text-risk-high">{soilMoisture}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="2"
                value={soilMoisture}
                onChange={(e) => setSoilMoisture(Number(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-faint mt-1">
                <span>10% (Dry)</span>
                <span>50% (Normal)</span>
                <span>80% (Critical)</span>
                <span>100% (Liquefaction)</span>
              </div>
            </div>

            {/* Slider 4: Geological Instability Multiplier */}
            <div className="rounded-xl border border-line bg-panel-2 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Mountain size={15} className="text-risk-critical" /> Slope / Shear Factor
                </span>
                <span className="font-mono text-sm font-bold text-risk-critical">{slopeFactor}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.8"
                step="0.1"
                value={slopeFactor}
                onChange={(e) => setSlopeFactor(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-faint mt-1">
                <span>0.8x (Hard Rock)</span>
                <span>1.2x (Weathered Shale)</span>
                <span>1.8x (Active Fault Shear)</span>
              </div>
            </div>
          </div>

          {/* Real-Time Impact Projection Cards */}
          <div className="rounded-xl border border-line bg-panel-2 p-4">
            <h3 className="font-display text-xs uppercase tracking-wider text-faint mb-3 font-mono">
              PROJECTED DISASTER IMPACT FOOTPRINT
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-panel p-3 border border-line">
                <span className="text-[10px] text-faint font-mono">CRITICAL SECTORS</span>
                <p className="font-display text-2xl font-bold text-risk-critical mt-0.5">
                  {criticalCount} <span className="text-xs font-normal text-muted">/ {zones.length}</span>
                </p>
              </div>

              <div className="rounded-lg bg-panel p-3 border border-line">
                <span className="text-[10px] text-faint font-mono">HIGH RISK SECTORS</span>
                <p className="font-display text-2xl font-bold text-risk-high mt-0.5">
                  {highCount} <span className="text-xs font-normal text-muted">/ {zones.length}</span>
                </p>
              </div>

              <div className="rounded-lg bg-panel p-3 border border-line">
                <span className="text-[10px] text-faint font-mono">SEVERED HIGHWAYS</span>
                <p className="font-display text-2xl font-bold text-amber mt-0.5">
                  {severedRoads} <span className="text-xs font-normal text-muted">Corridors</span>
                </p>
              </div>

              <div className="rounded-lg bg-panel p-3 border border-line">
                <span className="text-[10px] text-faint font-mono">POPULATION THREAT</span>
                <p className="font-display text-2xl font-bold text-ink mt-0.5">
                  {exposedPopulation.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Sector-by-Sector Simulation Forecast Table */}
          <div className="rounded-xl border border-line bg-panel-2 overflow-hidden">
            <div className="p-3 border-b border-line bg-panel text-xs font-mono text-muted flex justify-between items-center">
              <span>PROJECTED RISK BY SECTOR</span>
              <span>SIMULATED PROBABILITY</span>
            </div>
            <div className="divide-y divide-line max-h-56 overflow-y-auto">
              {simulatedResults.map((zone) => (
                <div key={zone.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="font-semibold text-ink truncate">{zone.name}</p>
                    <p className="text-[10px] text-muted">{zone.state} • {zone.geology || "Sheared flysch"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {zone.isRoadSevered && (
                      <span className="rounded bg-risk-critical/15 text-risk-critical px-2 py-0.5 text-[10px] font-mono font-bold">
                        ROAD CUTOFF
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2.5 py-1 font-mono text-xs font-bold ${
                        zone.simulatedLevel === "critical"
                          ? "bg-risk-critical text-white"
                          : zone.simulatedLevel === "high"
                          ? "bg-risk-high text-white"
                          : "bg-panel text-muted border border-line"
                      }`}
                    >
                      {zone.simulatedRiskScore}/100 ({zone.simulatedLevel.toUpperCase()})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
