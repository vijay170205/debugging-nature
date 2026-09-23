import { useState } from "react";
import {
  ShieldAlert,
  Users,
  Truck,
  Building2,
  CheckCircle2,
  Send,
  MapPin,
} from "lucide-react";
import { emergencyResources } from "../data/riskZones";
import { useLanguage } from "../context/LanguageContext";

export default function EmergencyResponsePanel({ zones = [], onSelectZone }) {
  const { t } = useLanguage();
  const [resources, setResources] = useState(emergencyResources);
  const [dispatchedZones, setDispatchedZones] = useState({});
  const [activeTab, setActiveTab] = useState("priority"); // 'priority' | 'resources' | 'shelters'

  // Rank zones by urgency (AI score + population + road blockage)
  const prioritizedZones = [...zones].sort((a, b) => {
    const aUrgency = (a.riskScore || 0) * 1.5 + (a.roadStatus === "blocked" ? 40 : 0) + (a.population > 10000 ? 20 : 0);
    const bUrgency = (b.riskScore || 0) * 1.5 + (b.roadStatus === "blocked" ? 40 : 0) + (b.population > 10000 ? 20 : 0);
    return bUrgency - aUrgency;
  });

  const handleDispatchOrder = (zoneId, zoneName) => {
    setDispatchedZones((prev) => ({
      ...prev,
      [zoneId]: {
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        status: "Mobilized",
      },
    }));
    // Adjust resource count
    setResources((prev) => ({
      ...prev,
      ndrfBattalions: {
        ...prev.ndrfBattalions,
        deployed: Math.min(prev.ndrfBattalions.total, prev.ndrfBattalions.deployed + 1),
        standby: Math.max(0, prev.ndrfBattalions.standby - 1),
      },
      heavyMachinery: {
        ...prev.heavyMachinery,
        excavatorsDeployed: prev.heavyMachinery.excavatorsDeployed + 2,
        excavatorsStandby: Math.max(0, prev.heavyMachinery.excavatorsStandby - 2),
      },
    }));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-panel">
      {/* Header & Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-line px-5 py-3.5 bg-panel-2 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-risk-critical/15 text-risk-critical ring-1 ring-risk-critical/30">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-ink flex items-center gap-2">
              {t("emergencyResponse")} & Resource Allocation
              <span className="rounded-full bg-risk-critical/15 px-2 py-0.5 font-mono text-[10px] text-risk-critical font-bold">
                NDMA Priority Matrix
              </span>
            </h2>
            <p className="text-[11px] text-muted">
              Live district triage, NDRF/SDRF battlegroup deployment & emergency shelter status
            </p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex rounded-lg border border-line bg-panel p-0.5 text-xs">
          <button
            onClick={() => setActiveTab("priority")}
            className={`px-3 py-1 rounded-md transition cursor-pointer ${
              activeTab === "priority" ? "bg-panel-2 text-ink font-semibold" : "text-muted hover:text-ink"
            }`}
          >
            Sector Triage ({prioritizedZones.length})
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`px-3 py-1 rounded-md transition cursor-pointer ${
              activeTab === "resources" ? "bg-panel-2 text-teal font-semibold" : "text-muted hover:text-ink"
            }`}
          >
            Resource Inventory
          </button>
          <button
            onClick={() => setActiveTab("shelters")}
            className={`px-3 py-1 rounded-md transition cursor-pointer ${
              activeTab === "shelters" ? "bg-panel-2 text-amber font-semibold" : "text-muted hover:text-ink"
            }`}
          >
            Relief Shelters
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "priority" && (
          <div className="space-y-3">
            <div className="rounded-lg bg-panel-2/60 border border-line p-3 flex items-center justify-between text-xs text-muted">
              <span className="font-mono uppercase text-[10px] text-faint">
                RANKED BY: AI RISK INDEX + SEVERITY + POPULATION DENSITY + ROAD SEVERANCE
              </span>
              <span className="font-mono text-teal">ACTIVE MOBILIZATION PROTOCOL</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {prioritizedZones.map((zone, idx) => {
                const isDispatched = !!dispatchedZones[zone.id];
                const isCritical = zone.riskLevel === "critical";

                return (
                  <div
                    key={zone.id}
                    className={`rounded-xl border p-4 transition flex flex-col justify-between ${
                      isCritical
                        ? "border-risk-critical/40 bg-risk-critical/5 shadow-md shadow-risk-critical/5"
                        : "border-line bg-panel-2"
                    }`}
                  >
                    <div>
                      {/* Priority Tag & Severity */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                            idx === 0
                              ? "bg-risk-critical text-white"
                              : idx === 1
                              ? "bg-risk-high text-white"
                              : "bg-panel text-muted border border-line"
                          }`}
                        >
                          PRIORITY {idx + 1}
                        </span>
                        <span className="font-mono text-xs font-semibold text-ink">
                          AI Risk {zone.riskScore}/100
                        </span>
                      </div>

                      {/* Zone Name & Location */}
                      <h3 className="font-semibold text-sm text-ink leading-snug">
                        {zone.name}
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        {zone.district ? `${zone.district}, ` : ""}{zone.state}
                      </p>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 my-3 rounded-lg bg-panel p-2.5 border border-line text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-faint block">POPULATION EXPOSED</span>
                          <span className="font-bold text-ink">{zone.population?.toLocaleString("en-IN") || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-faint block">ROAD STATUS</span>
                          <span
                            className={`font-bold capitalize ${
                              zone.roadStatus === "blocked"
                                ? "text-risk-critical"
                                : zone.roadStatus === "at-risk"
                                ? "text-risk-high"
                                : "text-risk-low"
                            }`}
                          >
                            {zone.roadStatus?.replace("-", " ")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-faint block">24H RAIN TRIGGER</span>
                          <span className="font-bold text-amber">{zone.rainfall24h || zone.livePrecipitation || 0} mm</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-faint block">IN-CHARGE AGENCY</span>
                          <span className="font-bold text-teal truncate block">{zone.inChargeAgency || "BRO / PWD"}</span>
                        </div>
                      </div>

                      {zone.alternateRoute && (
                        <p className="text-[11px] text-muted mb-3 bg-panel-2 p-2 rounded border border-line/60">
                          <strong className="text-ink">Detour:</strong> {zone.alternateRoute}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-line/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectZone && onSelectZone(zone.id)}
                        className="rounded-lg border border-line bg-panel px-3 py-1.5 text-xs text-muted hover:text-ink transition flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin size={13} /> View on Map
                      </button>

                      {isDispatched ? (
                        <span className="flex items-center gap-1.5 text-xs font-mono font-semibold text-risk-low">
                          <CheckCircle2 size={14} /> Mobilized ({dispatchedZones[zone.id].time})
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDispatchOrder(zone.id, zone.name)}
                          className="rounded-lg bg-teal px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-teal/90 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Send size={13} /> Dispatch NDRF
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "resources" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* NDRF Card */}
            <div className="rounded-xl border border-line bg-panel-2 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-sm font-semibold text-ink">NDRF Battalions</span>
                  <ShieldAlert size={18} className="text-teal" />
                </div>
                <p className="text-xs text-muted mb-3">{resources.ndrfBattalions.headquarters}</p>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Deployed in Field:</span>
                    <span className="font-bold text-risk-critical">{resources.ndrfBattalions.deployed} Units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">On Standby:</span>
                    <span className="font-bold text-teal">{resources.ndrfBattalions.standby} Units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Total Rescue Troops:</span>
                    <span className="font-bold text-ink">{resources.ndrfBattalions.personnel} Personnel</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60">
                <div className="h-2 w-full bg-panel rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal"
                    style={{
                      width: `${(resources.ndrfBattalions.deployed / resources.ndrfBattalions.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* SDRF Units */}
            <div className="rounded-xl border border-line bg-panel-2 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-sm font-semibold text-ink">SDRF State Units</span>
                  <Users size={18} className="text-amber" />
                </div>
                <p className="text-xs text-muted mb-3">State Disaster Management Strike Teams</p>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Active in Disaster Zones:</span>
                    <span className="font-bold text-amber">{resources.sdrfUnits.deployed} Teams</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Base Readiness:</span>
                    <span className="font-bold text-teal">{resources.sdrfUnits.standby} Teams</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Specialist Personnel:</span>
                    <span className="font-bold text-ink">{resources.sdrfUnits.personnel} Troops</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60">
                <span className="font-mono text-[10px] text-faint">24/7 INTER-AGENCY COMMS ACTIVE</span>
              </div>
            </div>

            {/* Heavy Machinery */}
            <div className="rounded-xl border border-line bg-panel-2 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-sm font-semibold text-ink">BRO & PWD Machinery</span>
                  <Truck size={18} className="text-risk-high" />
                </div>
                <p className="text-xs text-muted mb-3">Excavation & Highway Debris Clearance</p>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Excavators Deployed:</span>
                    <span className="font-bold text-risk-high">{resources.heavyMachinery.excavatorsDeployed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Bulldozers & JCBs:</span>
                    <span className="font-bold text-ink">{resources.heavyMachinery.bulldozersDeployed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Tipper Trucks:</span>
                    <span className="font-bold text-ink">{resources.heavyMachinery.tipperTrucks}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60">
                <span className="font-mono text-[10px] text-faint">AVERAGE CLEARANCE RESPONSE: 45 MINS</span>
              </div>
            </div>

            {/* Medical Units */}
            <div className="rounded-xl border border-line bg-panel-2 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-sm font-semibold text-ink">Emergency Medical Support</span>
                  <Building2 size={18} className="text-risk-critical" />
                </div>
                <p className="text-xs text-muted mb-3">Mobile Surgical & Critical Trauma Care</p>
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted">Mobile Surgical Units:</span>
                    <span className="font-bold text-risk-critical">{resources.medicalUnits.mobileSurgicalUnits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Paramedic Ambulances:</span>
                    <span className="font-bold text-teal">{resources.medicalUnits.paramedicVans}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Trauma First-Aid Kits:</span>
                    <span className="font-bold text-ink">{resources.medicalUnits.traumaKitsDeployed}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-line/60">
                <span className="font-mono text-[10px] text-faint">AIR AMBULANCE HELIPADS COORDINATED</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "shelters" && (
          <div className="space-y-4">
            {/* Shelter Summary Bar */}
            <div className="rounded-xl border border-line bg-panel-2 p-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] uppercase font-mono text-faint">DESIGNATED SHELTERS</span>
                <p className="font-display text-2xl font-bold text-ink mt-0.5">{resources.reliefShelters.totalShelters}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-faint">TOTAL CAPACITY</span>
                <p className="font-display text-2xl font-bold text-teal mt-0.5">{resources.reliefShelters.totalCapacity.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-faint">CURRENT OCCUPANCY</span>
                <p className="font-display text-2xl font-bold text-amber mt-0.5">{resources.reliefShelters.currentOccupants.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-faint">AVAILABLE VACANCY</span>
                <p className="font-display text-2xl font-bold text-risk-low mt-0.5">{resources.reliefShelters.availableSpace.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="rounded-xl border border-line bg-panel-2 p-4">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-muted">Regional Relief Shelter Utilization Rate</span>
                <span className="font-bold text-ink">
                  {Math.round((resources.reliefShelters.currentOccupants / resources.reliefShelters.totalCapacity) * 100)}% Occupied
                </span>
              </div>
              <div className="h-3 w-full bg-panel rounded-full overflow-hidden border border-line">
                <div
                  className="h-full bg-amber transition-all duration-500"
                  style={{
                    width: `${(resources.reliefShelters.currentOccupants / resources.reliefShelters.totalCapacity) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
