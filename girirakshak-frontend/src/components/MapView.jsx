import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Marker,
  Popup,
  Tooltip,
  LayersControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  RISK_LEVELS,
  vulnerableRoads,
  criticalInfrastructure,
  iotSensors,
} from "../data/riskZones";
import { useLanguage } from "../context/LanguageContext";
import {
  Search,
  Filter,
} from "lucide-react";

const { BaseLayer, Overlay } = LayersControl;
const NER_CENTER = [25.6, 92.9];

const createPhotoIcon = (reporterType) => {
  const isOfficial = reporterType === "field-official";
  const bg = isOfficial ? "#2a9d8f" : "#e0a83c";
  return L.divIcon({
    className: "custom-geotag-pin",
    html: `
      <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center;">
        <span style="position:absolute; width:100%; height:100%; border-radius:50%; background:${bg}; opacity:0.4; animation: pulse-ring 2s infinite;"></span>
        <div style="position:relative; width:26px; height:26px; border-radius:50%; background:${bg}; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.5); color:#ffffff; font-size:13px;">
          📷
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

const createInfraIcon = (type) => {
  const emoji = type === "hospital" ? "🏥" : type === "shelter" ? "⛺" : "🌉";
  return L.divIcon({
    className: "custom-infra-pin",
    html: `
      <div style="width:24px; height:24px; border-radius:50%; background:#101a2e; border:1.5px solid #2a9d8f; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.4); font-size:12px;">
        ${emoji}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const createIotIcon = (warning) => {
  const color = warning ? "#e0483f" : "#2a9d8f";
  return L.divIcon({
    className: "custom-iot-pin",
    html: `
      <div style="position:relative; width:22px; height:22px; display:flex; align-items:center; justify-content:center;">
        <span style="position:absolute; width:100%; height:100%; border-radius:50%; background:${color}; opacity:0.3; animation: pulse-ring 2s infinite;"></span>
        <div style="width:16px; height:16px; border-radius:50%; background:${color}; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; font-size:8px; color:white;">
          📟
        </div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
};

function MapFlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target && target.lat != null && target.lng != null) {
      map.flyTo([target.lat, target.lng], 13, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

function radiusFor(score) {
  return 8 + (score / 100) * 10;
}

function rainStyle(mm) {
  if (mm == null) return { color: "#5b6c88", label: "No live reading" };
  if (mm < 1) return { color: "#37a06b", label: "Low" };
  if (mm < 5) return { color: "#e0a83c", label: "Moderate" };
  if (mm < 15) return { color: "#d97f36", label: "Heavy" };
  return { color: "#e0483f", label: "Extreme" };
}

function moistureStyle(value) {
  if (value == null) return "#5b6c88";
  if (value < 30) return "#37a06b";
  if (value < 60) return "#e0a83c";
  if (value < 80) return "#d97f36";
  return "#e0483f";
}

export default function MapView({
  zones,
  selectedZoneId,
  onSelectZone,
  environment,
  reports = [],
  flyTarget = null,
  onInspectReport,
  lowBandwidth = false,
}) {
  const { t } = useLanguage();
  const [stateFilter, setStateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredZones = zones.filter((zone) => {
    const matchState = stateFilter === "all" || zone.state?.toLowerCase() === stateFilter.toLowerCase();
    const matchSearch =
      !searchQuery ||
      zone.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.district?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchState && matchSearch;
  });

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-line bg-backdrop">
      <MapContainer
        center={NER_CENTER}
        zoom={6}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: "#0a1220" }}
      >
        <MapFlyTo target={flyTarget} />

        <LayersControl position="topright">
          <BaseLayer checked name="Dark GIS Command">
            <TileLayer
              attribution='&copy; OpenStreetMap &copy; CARTO'
              url={
                lowBandwidth
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              }
            />
          </BaseLayer>

          {!lowBandwidth && (
            <>
              <BaseLayer name="Satellite Imagery (Esri)">
                <TileLayer
                  attribution="Tiles &copy; Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />
              </BaseLayer>

              <BaseLayer name="Topography & Elevation (SRTM)">
                <TileLayer
                  attribution="OpenTopoMap &copy; SRTM"
                  url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
                  maxZoom={17}
                />
              </BaseLayer>
            </>
          )}

          {/* 1. Geotagged Field Reports */}
          <Overlay checked name="📷 Geotagged Field Reports">
            <>
              {reports.map((report) => (
                <Marker
                  key={report.id || report._id}
                  position={[report.lat, report.lng]}
                  icon={createPhotoIcon(report.reporterType)}
                >
                  <Tooltip direction="top" offset={[0, -16]} opacity={1}>
                    <span className="font-medium">📷 {report.incidentType || "Field Report"}</span>
                  </Tooltip>
                  <Popup>
                    <div className="min-w-[240px] max-w-[280px] font-body">
                      {report.photoUrl && (
                        <div className="mb-2 h-28 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-900">
                          <img
                            src={report.photoUrl}
                            alt="Field observation"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {report.incidentType || "Field Hazard Report"}
                        </span>
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            report.reporterType === "field-official"
                              ? "bg-teal-100 text-teal-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {report.reporterType === "field-official" ? "Official" : "Citizen"}
                        </span>
                      </div>

                      <div className="my-2 rounded bg-slate-100 p-2 font-mono text-[11px] text-slate-800 border border-slate-200">
                        <div className="text-teal-700 font-semibold">
                          LAT: {report.lat?.toFixed(6)}° N
                        </div>
                        <div className="text-teal-700 font-semibold">
                          LNG: {report.lng?.toFixed(6)}° E
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          GPS accuracy: ±{report.accuracy || 5.0}m
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                        {report.description}
                      </p>

                      {report.nearestZoneName && (
                        <p className="mt-1 text-[10px] text-amber-700 font-medium">
                          📍 {report.nearestZoneName.split("–")[0]}
                        </p>
                      )}

                      {onInspectReport && (
                        <button
                          type="button"
                          onClick={() => onInspectReport(report)}
                          className="mt-2.5 w-full cursor-pointer rounded-md bg-teal-600 py-1.5 text-center text-xs font-semibold text-white hover:bg-teal-700 transition"
                        >
                          Inspect Geotagged Intel
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          </Overlay>

          {/* 2. AI Landslide Risk Zones */}
          <Overlay checked name="🌋 AI Landslide Risk Zones">
            <>
              {filteredZones.map((zone) => {
                const info = RISK_LEVELS[zone.riskLevel] || RISK_LEVELS.low;
                const isSelected = zone.id === selectedZoneId;
                const liveRain = zone.livePrecipitation;
                const liveMoisture = zone.liveSoilMoisture ?? zone.soilMoisture;

                return (
                  <CircleMarker
                    key={zone.id}
                    center={[zone.lat, zone.lng]}
                    radius={radiusFor(zone.riskScore)}
                    pathOptions={{
                      color: info.color,
                      fillColor: info.color,
                      fillOpacity: isSelected ? 0.9 : 0.58,
                      weight: isSelected ? 3 : 1.5,
                    }}
                    eventHandlers={{ click: () => onSelectZone && onSelectZone(zone.id) }}
                  >
                    <Tooltip direction="top" offset={[0, -4]} opacity={1}>
                      <span className="font-medium">{zone.name}</span>
                    </Tooltip>
                    <Popup>
                      <div className="min-w-[230px] font-body">
                        <p className="mb-0.5 text-sm font-semibold text-slate-900">{zone.name}</p>
                        <p className="mb-2 text-[11px] text-slate-500">{zone.district ? `${zone.district}, ` : ""}{zone.state}</p>
                        <div className="mb-2">
                          <span
                            className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
                            style={{ backgroundColor: `${info.color}22`, color: info.color }}
                          >
                            {info.label} · AI Risk {zone.riskScore}/100
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-slate-600">
                          <span>Live Precip.</span><strong>{liveRain == null ? "N/A" : `${liveRain} mm/h`}</strong>
                          <span>Soil Moisture</span><strong>{liveMoisture == null ? "N/A" : `${liveMoisture}%`}</strong>
                          <span>Deformation</span><strong className="capitalize">{zone.deformationTrend || "Stable"}</strong>
                          <span>Road Status</span><strong className="capitalize">{zone.roadStatus?.replace("-", " ")}</strong>
                          <span>Slope Angle</span><strong>{zone.slope || 35}°</strong>
                          <span>InSAR Velocity</span><strong>{zone.deformationVelocityMmYear || 14} mm/yr</strong>
                        </div>
                        {zone.alternateRoute && (
                          <p className="mt-2 text-[10px] text-slate-600 bg-slate-100 p-1.5 rounded">
                            <strong>Detour:</strong> {zone.alternateRoute}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </>
          </Overlay>

          {/* 3. Vulnerable Road Corridors */}
          <Overlay checked name="🛣️ Vulnerable Road Corridors">
            <>
              {vulnerableRoads.map((road) => (
                <CircleMarker
                  key={road.id}
                  center={[road.lat, road.lng]}
                  radius={7}
                  pathOptions={{
                    color: road.status === "blocked" ? "#e0483f" : road.status === "at-risk" ? "#d97f36" : "#37a06b",
                    fillColor: road.status === "blocked" ? "#e0483f" : road.status === "at-risk" ? "#d97f36" : "#37a06b",
                    fillOpacity: 0.85,
                    weight: 2,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -4]}>
                    <span>🛣️ {road.name} ({road.status.toUpperCase()})</span>
                  </Tooltip>
                  <Popup>
                    <div className="min-w-[200px] font-body text-xs">
                      <p className="font-semibold text-slate-900 text-sm">{road.name}</p>
                      <p className="text-slate-500">{road.state} • {road.agency}</p>
                      <div className="my-2 p-2 rounded bg-slate-100 font-mono text-[11px]">
                        <div>Status: <strong className="uppercase">{road.status}</strong></div>
                        <div>Blockage: {road.blockedKilometer}</div>
                        <div>Clearance ETA: {road.estimatedClearanceHours}h</div>
                      </div>
                      <p className="text-slate-600 text-[11px]"><strong>Detour:</strong> {road.detour}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </>
          </Overlay>

          {/* 4. Critical Infrastructure & Shelters */}
          <Overlay name="🏥 Infrastructure & Shelters">
            <>
              {criticalInfrastructure.map((inf) => (
                <Marker key={inf.id} position={[inf.lat, inf.lng]} icon={createInfraIcon(inf.type)}>
                  <Tooltip direction="top">
                    <span>{inf.name}</span>
                  </Tooltip>
                  <Popup>
                    <div className="min-w-[180px] font-body text-xs">
                      <p className="font-semibold text-slate-900">{inf.name}</p>
                      <p className="text-slate-500 capitalize">{inf.type} • {inf.status}</p>
                      <p className="mt-1 font-mono text-[11px] text-teal-700">{inf.capacity}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          </Overlay>

          {/* 5. IoT Sensor Telemetry Nodes */}
          <Overlay name="📟 IoT Sensor Nodes & Rain Gauges">
            <>
              {iotSensors.map((sensor) => (
                <Marker key={sensor.id} position={[sensor.lat, sensor.lng]} icon={createIotIcon(sensor.warning)}>
                  <Tooltip direction="top">
                    <span>📟 {sensor.name}</span>
                  </Tooltip>
                  <Popup>
                    <div className="min-w-[180px] font-body text-xs">
                      <p className="font-semibold text-slate-900">{sensor.name}</p>
                      <p className="text-slate-500 font-mono text-[10px]">{sensor.type}</p>
                      <div className="mt-1.5 p-1.5 bg-slate-100 rounded font-mono text-[11px]">
                        <div>Live: <strong className={sensor.warning ? "text-red-600" : "text-teal-700"}>{sensor.reading}</strong></div>
                        <div>Battery: {sensor.battery}</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          </Overlay>

          {/* 6. Near-Real-Time Rainfall */}
          <Overlay checked name="🌧️ Live Rainfall Heatmap">
            <>
              {filteredZones.map((zone) => {
                const style = rainStyle(zone.livePrecipitation);
                return (
                  <Circle
                    key={`rain-${zone.id}`}
                    center={[zone.lat, zone.lng]}
                    radius={Math.max(7000, ((zone.livePrecipitation ?? 0) + 2) * 3500)}
                    pathOptions={{
                      color: style.color,
                      fillColor: style.color,
                      fillOpacity: 0.18,
                      weight: 1.5,
                    }}
                  >
                    <Tooltip>
                      🌧️ {zone.name}<br />
                      {zone.livePrecipitation == null ? "Local fallback / unavailable" : `${zone.livePrecipitation} mm/h · ${style.label}`}
                    </Tooltip>
                  </Circle>
                );
              })}
            </>
          </Overlay>

          {/* 7. Soil Moisture Saturation */}
          <Overlay name="💧 Soil Moisture Saturation">
            <>
              {filteredZones.map((zone) => {
                const value = zone.liveSoilMoisture ?? zone.soilMoisture;
                const color = moistureStyle(value);
                return (
                  <Circle
                    key={`soil-${zone.id}`}
                    center={[zone.lat, zone.lng]}
                    radius={18000}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.24,
                      weight: 1,
                    }}
                  >
                    <Tooltip>
                      💧 {zone.name}<br />
                      Soil moisture: {value == null ? "N/A" : `${value}%`}
                    </Tooltip>
                  </Circle>
                );
              })}
            </>
          </Overlay>
        </LayersControl>
      </MapContainer>

      {/* Floating Search & State Filter Control */}
      <div className="absolute left-3 top-3 z-[1000] flex flex-col gap-2 max-w-[280px]">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-panel/95 px-3 py-1.5 shadow-lg backdrop-blur text-xs">
          <Search size={13} className="text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search state, highway or zone…"
            className="w-full bg-transparent text-xs text-ink placeholder-faint focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-line bg-panel/95 px-2.5 py-1 shadow-lg backdrop-blur text-[11px] font-mono">
          <Filter size={11} className="text-teal" />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="bg-transparent text-muted focus:outline-none cursor-pointer w-full text-[11px]"
          >
            <option value="all" className="bg-panel text-ink">All 8 NER States</option>
            <option value="Meghalaya" className="bg-panel text-ink">Meghalaya</option>
            <option value="Sikkim" className="bg-panel text-ink">Sikkim</option>
            <option value="Assam" className="bg-panel text-ink">Assam</option>
            <option value="Mizoram" className="bg-panel text-ink">Mizoram</option>
            <option value="Nagaland" className="bg-panel text-ink">Nagaland</option>
            <option value="Arunachal Pradesh" className="bg-panel text-ink">Arunachal Pradesh</option>
            <option value="Manipur" className="bg-panel text-ink">Manipur</option>
            <option value="Tripura" className="bg-panel text-ink">Tripura</option>
          </select>
        </div>
      </div>

      {/* Severity Legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg border border-line bg-panel/90 px-3 py-2 backdrop-blur">
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">AI Landslide Risk Severity</p>
        <div className="flex items-center gap-3">
          {Object.entries(RISK_LEVELS).map(([key, info]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: info.color }} />
              <span className="text-[10px] text-muted">{info.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
