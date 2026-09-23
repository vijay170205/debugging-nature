import { useState } from "react";
import {
  X,
  MapPin,
  Camera,
  ShieldCheck,
  ExternalLink,
  Compass,
} from "lucide-react";

function formatLat(lat) {
  if (lat == null) return "--";
  const dir = lat >= 0 ? "N" : "S";
  return `${Math.abs(lat).toFixed(6)}° ${dir}`;
}

function formatLng(lng) {
  if (lng == null) return "--";
  const dir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lng).toFixed(6)}° ${dir}`;
}

export default function GeotagReportsModal({
  isOpen,
  onClose,
  reports = [],
  onSelectOnMap,
}) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [filterType, setFilterType] = useState("all");

  if (!isOpen) return null;

  const activeReport = selectedReport || reports[0] || null;

  const filteredReports = reports.filter((r) => {
    if (filterType === "all") return true;
    if (filterType === "official") return r.reporterType === "field-official";
    if (filterType === "citizen") return r.reporterType === "citizen";
    return true;
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-panel-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/15 text-teal ring-1 ring-teal/30">
              <Camera size={18} />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
                Geotagged Field Reports & Photo Intel
                <span className="rounded-full bg-teal/15 px-2 py-0.5 font-mono text-[11px] text-teal">
                  {reports.length} Recorded
                </span>
              </h2>
              <p className="text-[11px] text-muted">
                Ground-truth disaster imagery with verified GPS coordinates & telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter */}
            <div className="hidden sm:flex rounded-lg border border-line bg-panel p-0.5 text-xs">
              <button
                onClick={() => setFilterType("all")}
                className={`px-2.5 py-1 rounded-md transition ${
                  filterType === "all" ? "bg-panel-2 text-ink font-semibold" : "text-muted hover:text-ink"
                }`}
              >
                All ({reports.length})
              </button>
              <button
                onClick={() => setFilterType("official")}
                className={`px-2.5 py-1 rounded-md transition ${
                  filterType === "official" ? "bg-panel-2 text-teal font-semibold" : "text-muted hover:text-ink"
                }`}
              >
                Field Officials
              </button>
              <button
                onClick={() => setFilterType("citizen")}
                className={`px-2.5 py-1 rounded-md transition ${
                  filterType === "citizen" ? "bg-panel-2 text-amber font-semibold" : "text-muted hover:text-ink"
                }`}
              >
                Citizen
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted hover:bg-panel hover:text-ink transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Column: Report List */}
          <div className="md:col-span-5 border-r border-line flex flex-col h-full overflow-hidden bg-panel/50">
            <div className="p-3 border-b border-line bg-panel-2/50 text-[11px] text-muted font-mono flex items-center justify-between">
              <span>CAPTURED INCIDENTS</span>
              <span>LATEST FIRST</span>
            </div>
            <div className="flex-1 divide-y divide-line overflow-y-auto">
              {filteredReports.length === 0 ? (
                <div className="p-8 text-center text-muted text-xs">
                  No geotagged reports found. Use the camera tool to capture a report!
                </div>
              ) : (
                filteredReports.map((report) => {
                  const isSelected = activeReport?._id === report._id || activeReport?.id === report.id;
                  const isOfficial = report.reporterType === "field-official";
                  const dateStr = report.createdAt
                    ? new Date(report.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Recent";

                  return (
                    <button
                      key={report._id || report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full text-left p-3.5 transition flex gap-3 items-start ${
                        isSelected ? "bg-teal/10 border-l-2 border-teal" : "hover:bg-panel-2"
                      }`}
                    >
                      {/* Photo Thumbnail */}
                      <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-line bg-backdrop relative">
                        {report.photoUrl ? (
                          <img
                            src={report.photoUrl}
                            alt="Incident thumb"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-faint">
                            <Camera size={18} />
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 py-0.5 text-center font-mono text-[8px] text-white">
                          GPS TAG
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-medium ${
                              isOfficial
                                ? "bg-teal/15 text-teal border border-teal/30"
                                : "bg-amber/15 text-amber border border-amber/30"
                            }`}
                          >
                            {isOfficial ? "Field Official" : "Citizen"}
                          </span>
                          <span className="font-mono text-[10px] text-faint">{dateStr}</span>
                        </div>

                        <p className="font-medium text-xs text-ink truncate">
                          {report.incidentType || "Field Observation"}
                        </p>

                        <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-muted">
                          <span className="text-teal font-semibold">
                            {formatLat(report.lat)}, {formatLng(report.lng)}
                          </span>
                        </div>

                        {report.nearestZoneName && (
                          <p className="mt-0.5 text-[10px] text-faint truncate">
                            Near: {report.nearestZoneName.split("–")[0]}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Report Detail */}
          <div className="md:col-span-7 flex flex-col h-full overflow-y-auto p-5 bg-backdrop">
            {activeReport ? (
              <div className="space-y-4">
                {/* Photo Viewer */}
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-panel flex items-center justify-center shadow-lg group">
                  {activeReport.photoUrl ? (
                    <img
                      src={activeReport.photoUrl}
                      alt="Geotagged observation full"
                      className="h-full w-full object-contain bg-black"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-muted">
                      <Camera size={32} className="mb-2" />
                      <p className="text-xs">No image attached</p>
                    </div>
                  )}

                  {/* Watermark/Telemetery Pill Overlay */}
                  <div className="absolute top-3 left-3 rounded-lg bg-black/75 px-2.5 py-1 backdrop-blur border border-white/10 text-white font-mono text-[10px] flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-teal" />
                    <span>GIRIRAKSHAK FORENSIC TELEMETRY</span>
                  </div>

                  {activeReport.photoUrl && (
                    <a
                      href={activeReport.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 right-3 rounded-lg bg-black/80 px-2.5 py-1.5 backdrop-blur text-white text-xs flex items-center gap-1.5 hover:bg-black transition"
                    >
                      <ExternalLink size={13} /> Full Resolution
                    </a>
                  )}
                </div>

                {/* GPS Coordinates & Telemetry Cards */}
                <div className="rounded-xl border border-line bg-panel p-4">
                  <h3 className="font-display text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                    <Compass size={16} className="text-teal" /> Verified Geotag Coordinates
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="rounded-lg bg-panel-2 p-2.5 border border-line">
                      <span className="text-[10px] uppercase font-mono text-faint">Latitude</span>
                      <p className="font-mono text-sm font-bold text-teal mt-0.5">
                        {formatLat(activeReport.lat)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-panel-2 p-2.5 border border-line">
                      <span className="text-[10px] uppercase font-mono text-faint">Longitude</span>
                      <p className="font-mono text-sm font-bold text-teal mt-0.5">
                        {formatLng(activeReport.lng)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-panel-2 p-2.5 border border-line col-span-2 sm:col-span-1">
                      <span className="text-[10px] uppercase font-mono text-faint">GPS Accuracy</span>
                      <p className="font-mono text-sm font-bold text-ink mt-0.5">
                        ±{activeReport.accuracy || 5.0} m
                      </p>
                    </div>
                  </div>

                  {/* Nearest Risk Zone info */}
                  {activeReport.nearestZoneName && (
                    <div className="mt-3 pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                      <span className="text-muted">Proximity:</span>
                      <span className="font-mono text-amber font-medium">
                        {activeReport.distanceKm != null ? `${activeReport.distanceKm.toFixed(2)} km from ` : ""}
                        {activeReport.nearestZoneName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Observations & Field Data */}
                <div className="rounded-xl border border-line bg-panel p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-faint">
                      Incident Classification
                    </span>
                    <p className="text-sm font-semibold text-ink mt-0.5">
                      {activeReport.incidentType || "Field Hazard Observation"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-faint">
                      Observations & Field Description
                    </span>
                    <p className="text-xs text-muted leading-relaxed mt-1 bg-panel-2 p-3 rounded-lg border border-line/60">
                      {activeReport.description || "No specific field notes provided."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div>
                      <span className="text-faint text-[10px] block">Reporter Type</span>
                      <span className="font-medium text-ink capitalize">
                        {activeReport.reporterType === "field-official"
                          ? "Field Official (PWD/NDRF)"
                          : "Citizen Observer"}
                      </span>
                    </div>
                    <div>
                      <span className="text-faint text-[10px] block">Verification Status</span>
                      <span className="font-medium text-teal capitalize">
                        {activeReport.status || "Pending Verification"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action button: Focus on Map */}
                {onSelectOnMap && (
                  <button
                    onClick={() => {
                      onSelectOnMap(activeReport);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal/15 border border-teal/40 py-2.5 text-xs font-semibold text-teal hover:bg-teal/25 transition"
                  >
                    <MapPin size={15} /> Locate & Highlight on GIS Map
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted text-xs">
                Select a report to view details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
