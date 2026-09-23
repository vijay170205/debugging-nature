import { useEffect, useState, useCallback } from "react";
import Header from "./components/Header";
import StatCards from "./components/StatCards";
import MapView from "./components/MapView";
import RiskZonesList from "./components/RiskZonesList";
import RiskExplanationPanel from "./components/RiskExplanationPanel";
import RoadStatusPanel from "./components/RoadStatusPanel";
import RainfallForecast from "./components/RainfallForecast";
import AlertsPanel from "./components/AlertsPanel";
import EmergencyResponsePanel from "./components/EmergencyResponsePanel";
import HistoricalAnalyticsPanel from "./components/HistoricalAnalyticsPanel";
import GeotagCaptureModal from "./components/GeotagCaptureModal";
import GeotagReportsModal from "./components/GeotagReportsModal";
import BroadcastAlertModal from "./components/BroadcastAlertModal";
import RiskSimulationModal from "./components/RiskSimulationModal";
import { useLanguage } from "./context/LanguageContext";
import {
  MapPinned,
  ShieldAlert,
  BrainCircuit,
  Camera,
} from "lucide-react";
import {
  fetchRiskZones,
  fetchAlerts,
  fetchRainfallForecast,
  fetchSummary,
  fetchLiveEnvironment,
  fetchReports,
  submitReport,
  broadcastAlert,
} from "./services/api";

function nowStamp() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function mergeEnvironment(zones, environment) {
  const byId = Object.fromEntries((environment?.data || []).map((item) => [item.zoneId, item]));
  return zones.map((zone) => {
    const live = byId[zone.id];
    if (!live) return zone;
    return {
      ...zone,
      livePrecipitation: live.precipitationMm,
      liveRain: live.rainMm,
      liveSoilMoisture: live.soilMoisture,
      weatherCode: live.weatherCode,
      windSpeedKmh: live.windSpeedKmh,
      environmentalUpdatedAt: live.updatedAt,
      riskScore: live.riskScore ?? zone.riskScore,
      riskLevel: live.riskLevel ?? zone.riskLevel,
      riskFactors: live.riskFactors || live.ml?.explanation || live.factors || [],
      riskMethod: live.method,
      ml: live.ml,
      threshold: live.threshold,
      features: live.features,
      riskConfidence: live.ml?.confidence,
    };
  });
}

export default function App() {
  const { t } = useLanguage();

  // Core Data States
  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [summary, setSummary] = useState(null);
  const [environment, setEnvironment] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(nowStamp());

  // Navigation & Workspace Tabs ('gis' | 'response' | 'analytics' | 'intel')
  const [activeTab, setActiveTab] = useState("gis");

  // Bandwidth Mode
  const [lowBandwidth, setLowBandwidth] = useState(false);

  // Modal Control States
  const [isGeotagModalOpen, setIsGeotagModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [z, a, f, s, env, reps] = await Promise.all([
          fetchRiskZones(),
          fetchAlerts(),
          fetchRainfallForecast(),
          fetchSummary(),
          fetchLiveEnvironment(),
          fetchReports(),
        ]);

        if (cancelled) return;
        setZones(mergeEnvironment(z, env));
        setAlerts(a);
        setForecast(f);
        setSummary(s);
        setEnvironment(env);
        setReports(reps);
        setSelectedZoneId((prev) => prev ?? z[0]?.id ?? null);
        setLastSync(nowStamp());
        setError(null);
      } catch {
        if (!cancelled) setError("Could not reach the monitoring services. Showing last known state.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const handleReportSubmitted = useCallback(async (formData) => {
    const newReport = await submitReport(formData);
    setReports((prev) => [newReport, ...prev]);
    if (newReport.lat != null && newReport.lng != null) {
      setFlyTarget({ lat: newReport.lat, lng: newReport.lng });
    }
    return newReport;
  }, []);

  const handleBroadcastAlert = useCallback(async (alertData) => {
    const newAlert = await broadcastAlert(alertData);
    setAlerts((prev) => [newAlert, ...prev]);
    return newAlert;
  }, []);

  const handleInspectReport = useCallback((report) => {
    if (report && report.lat != null && report.lng != null) {
      setFlyTarget({ lat: report.lat, lng: report.lng });
    }
    setIsReportsModalOpen(true);
  }, []);

  const handleSelectReportOnMap = useCallback((report) => {
    if (report && report.lat != null && report.lng != null) {
      setFlyTarget({ lat: report.lat, lng: report.lng });
      setActiveTab("gis");
    }
  }, []);

  const handleSelectZoneFromResponse = useCallback((zoneId) => {
    setSelectedZoneId(zoneId);
    const z = zones.find((item) => item.id === zoneId);
    if (z) {
      setFlyTarget({ lat: z.lat, lng: z.lng });
      setActiveTab("gis");
    }
  }, [zones]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-backdrop">
        <div className="flex flex-col items-center gap-3 text-muted">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 animate-ping rounded-full bg-teal" />
            <span className="font-mono text-sm font-semibold text-ink">GiriRakshak NER Command Center</span>
          </div>
          <span className="font-mono text-xs text-faint">Initializing Hybrid AI, Satellite Feeds & IoT Telemetry…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-backdrop overflow-hidden">
      {/* 1. Header */}
      <Header
        lastSync={lastSync}
        live={environment?.live}
        source={environment?.source}
        onOpenGeotagModal={() => setIsGeotagModalOpen(true)}
        onOpenReportsModal={() => setIsReportsModalOpen(true)}
        onOpenBroadcastModal={() => setIsBroadcastModalOpen(true)}
        onOpenSimulationModal={() => setIsSimulationModalOpen(true)}
        reportCount={reports.length}
        lowBandwidth={lowBandwidth}
        onToggleLowBandwidth={() => setLowBandwidth(!lowBandwidth)}
      />

      {/* 2. Sub-Navigation Tabs Bar */}
      <div className="flex items-center justify-between border-b border-line bg-panel px-4 py-1.5 sm:px-6">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("gis")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === "gis"
                ? "bg-teal/15 text-teal ring-1 ring-teal/30"
                : "text-muted hover:bg-panel-2 hover:text-ink"
            }`}
          >
            <MapPinned size={14} />
            <span>{t("tabGis")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("response")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === "response"
                ? "bg-risk-critical/15 text-risk-critical ring-1 ring-risk-critical/30"
                : "text-muted hover:bg-panel-2 hover:text-ink"
            }`}
          >
            <ShieldAlert size={14} />
            <span>{t("tabResponse")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === "analytics"
                ? "bg-amber/15 text-amber ring-1 ring-amber/30"
                : "text-muted hover:bg-panel-2 hover:text-ink"
            }`}
          >
            <BrainCircuit size={14} />
            <span>{t("tabAnalytics")}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReportsModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:bg-panel-2 hover:text-ink transition cursor-pointer"
          >
            <Camera size={14} />
            <span>{t("tabIntel")}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-faint">
          <span className="hidden sm:inline">NDMA • GSI • IMD • BRO</span>
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          <span className="text-teal font-semibold">24/7 OPERATIONAL</span>
        </div>
      </div>

      {error && (
        <div className="border-b border-risk-high/30 bg-risk-high/10 px-6 py-1.5 text-center text-xs text-risk-high font-mono">
          {error}
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <main className="flex-1 overflow-hidden p-3 sm:p-4 flex flex-col gap-3">
        {/* Stat Cards Header */}
        <div>
          <StatCards summary={summary} />
        </div>

        {/* Tab 1: GIS Command Hub View */}
        {activeTab === "gis" && (
          <div className="grid flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[1fr_320px]">
  <div className="grid grid-rows-[1fr_auto] gap-3 overflow-hidden">
    <MapView
      zones={zones}
      selectedZoneId={selectedZoneId}
      onSelectZone={setSelectedZoneId}
      environment={environment}
      reports={reports}
      flyTarget={flyTarget}
      onInspectReport={handleInspectReport}
      lowBandwidth={lowBandwidth}
    />
    <RainfallForecast data={forecast} />
  </div>

  <div className="grid grid-rows-4 gap-3 overflow-hidden">
    <RiskZonesList
      zones={zones}
      selectedZoneId={selectedZoneId}
      onSelectZone={setSelectedZoneId}
    />
    <RiskExplanationPanel zone={zones.find((z) => z.id === selectedZoneId)} />
    <AlertsPanel alerts={alerts} zones={zones} />
    <div className="overflow-y-auto">
      <RoadStatusPanel zones={zones} />
    </div>
  </div>
</div>
          
          
        )}

        {/* Tab 2: Emergency Response & Deployment */}
        {activeTab === "response" && (
          <div className="flex-1 overflow-hidden">
            <EmergencyResponsePanel
              zones={zones}
              onSelectZone={handleSelectZoneFromResponse}
            />
          </div>
        )}

        {/* Tab 3: AI Predictive Analytics & History */}
        {activeTab === "analytics" && (
          <div className="flex-1 overflow-hidden">
            <HistoricalAnalyticsPanel
              zones={zones}
              onSelectZone={handleSelectZoneFromResponse}
            />
          </div>
        )}
      </main>

      {/* 4. Modals */}
      {/* Geotag Image Capture Modal */}
      <GeotagCaptureModal
        isOpen={isGeotagModalOpen}
        onClose={() => setIsGeotagModalOpen(false)}
        zones={zones}
        onReportSubmitted={handleReportSubmitted}
      />

      {/* Geotagged Reports Intel Inspector Modal */}
      <GeotagReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
        reports={reports}
        onSelectOnMap={handleSelectReportOnMap}
      />

      {/* CAP Emergency Broadcast Modal */}
      <BroadcastAlertModal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        zones={zones}
        onBroadcast={handleBroadcastAlert}
      />

      {/* "What-If" Cloudburst Simulation Modal */}
      <RiskSimulationModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
        zones={zones}
      />
    </div>
  );
}
