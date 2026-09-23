import { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  X,
  MapPin,
  RefreshCw,
  SwitchCamera,
  Upload,
  CheckCircle2,
  Compass,
  Crosshair,
  Sparkles,
  Download,
  ShieldCheck,
} from "lucide-react";

// Haversine distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearestRiskZone(lat, lng, zones) {
  if (!zones || zones.length === 0 || lat == null || lng == null) return null;
  let nearest = null;
  let minDistance = Infinity;

  for (const zone of zones) {
    const dist = calculateDistance(lat, lng, zone.lat, zone.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = { zone, distanceKm: dist };
    }
  }
  return nearest;
}

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

export default function GeotagCaptureModal({ isOpen, onClose, zones = [], onReportSubmitted }) {
  // Camera & Media States
  const [useLiveCamera, setUseLiveCamera] = useState(true);
  const [facingMode, setFacingMode] = useState("environment");
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Captured Image & Geotag
  const [capturedImage, setCapturedImage] = useState(null);
  const [watermarkedBlob, setWatermarkedBlob] = useState(null);
  const [isProcessingWatermark, setIsProcessingWatermark] = useState(false);

  // GPS States
  const [coords, setCoords] = useState({
    lat: 25.2841,
    lng: 91.7328,
    accuracy: 4.2,
    altitude: 1430,
    timestamp: new Date().toISOString(),
  });
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Acquiring GPS fix…");
  const [manualOverride, setManualOverride] = useState(false);

  // Form Fields
  const [reporterType, setReporterType] = useState("field-official");
  const [incidentType, setIncidentType] = useState("Active Landslide & Debris Flow");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Nearest Zone Calculation
  const nearestInfo = findNearestRiskZone(coords.lat, coords.lng, zones);

  // 1. Geolocation Acquisition
  const acquireLocation = useCallback(() => {
    setIsLocating(true);
    setLocationStatus("Connecting to GPS satellites…");

    if (!navigator.geolocation) {
      setLocationStatus("Geolocation API unavailable. Using default NER coordinates.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy, altitude } = pos.coords;
        setCoords({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy ? Math.round(accuracy * 10) / 10 : 5.0,
          altitude: altitude ? Math.round(altitude) : null,
          timestamp: new Date(pos.timestamp).toISOString(),
        });
        setLocationStatus(`GPS Lock (±${Math.round(accuracy || 5)}m accuracy)`);
        setIsLocating(false);
      },
      (err) => {
        console.warn("GPS lookup notice:", err.message);
        setLocationStatus("GPS signal weak or permission denied. Using region benchmark.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (isOpen) {
      acquireLocation();
    }
  }, [isOpen, acquireLocation]);

  // 2. Camera Stream Handling
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.warn("Camera access failed, fallback to file upload:", err);
      setCameraError("Camera unavailable or permission denied. Please upload a photo.");
      setUseLiveCamera(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen && useLiveCamera && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, useLiveCamera, capturedImage, startCamera, stopCamera]);

  // 3. Watermarking Engine (Canvas Compositor)
  const burnGeotagWatermark = useCallback(
    (sourceImageElement, currentCoords) => {
      setIsProcessingWatermark(true);
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const width = sourceImageElement.naturalWidth || sourceImageElement.videoWidth || 1280;
        const height = sourceImageElement.naturalHeight || sourceImageElement.videoHeight || 720;

        canvas.width = width;
        canvas.height = height;

        // Draw base image
        ctx.drawImage(sourceImageElement, 0, 0, width, height);

        // Watermark Banner Dimensions
        const bannerHeight = Math.max(100, Math.round(height * 0.16));
        const padding = Math.round(width * 0.025);

        // Dark gradient backdrop
        const grad = ctx.createLinearGradient(0, height - bannerHeight - 40, 0, height);
        grad.addColorStop(0, "rgba(10, 18, 32, 0)");
        grad.addColorStop(0.3, "rgba(10, 18, 32, 0.85)");
        grad.addColorStop(1, "rgba(10, 18, 32, 0.98)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, height - bannerHeight - 40, width, bannerHeight + 40);

        // Accent top line
        ctx.fillStyle = "#2a9d8f";
        ctx.fillRect(0, height - bannerHeight - 2, width, 3);

        // Header text
        const primaryFontSize = Math.max(14, Math.round(width * 0.022));
        const secondaryFontSize = Math.max(11, Math.round(width * 0.016));

        ctx.fillStyle = "#2a9d8f";
        ctx.font = `bold ${primaryFontSize}px 'Space Grotesk', sans-serif`;
        ctx.fillText("🛡️ GIRIRAKSHAK AI DISASTER OBSERVATION", padding, height - bannerHeight + padding);

        // Geotag Coordinates
        const timeString = new Date(currentCoords.timestamp || Date.now()).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        ctx.fillStyle = "#e7ecf3";
        ctx.font = `600 ${primaryFontSize}px 'JetBrains Mono', monospace`;
        const latText = `LAT: ${formatLat(currentCoords.lat)}`;
        const lngText = `LNG: ${formatLng(currentCoords.lng)}`;
        ctx.fillText(`${latText}   |   ${lngText}`, padding, height - bannerHeight + padding + primaryFontSize + 8);

        // Metadata Subline
        ctx.fillStyle = "#90a0ba";
        ctx.font = `500 ${secondaryFontSize}px 'Inter', sans-serif`;
        const zoneText = nearestInfo?.zone?.name ? `Nearby: ${nearestInfo.zone.name} (${nearestInfo.distanceKm.toFixed(1)} km)` : "Northeast Regional Grid";
        const metaText = `ACCURACY: ±${currentCoords.accuracy}m   •   ${timeString} IST   •   ${zoneText}`;
        ctx.fillText(metaText, padding, height - padding + 2);

        // Export
        canvas.toBlob(
          (blob) => {
            const url = URL.createObjectURL(blob);
            setWatermarkedBlob(blob);
            setCapturedImage(url);
            setIsProcessingWatermark(false);
            resolve(url);
          },
          "image/jpeg",
          0.92
        );
      });
    },
    [nearestInfo]
  );

  // 4. Capture Snapshot from Video Stream
  const handleTakeSnapshot = async () => {
    if (!videoRef.current) return;
    await burnGeotagWatermark(videoRef.current, coords);
    stopCamera();
  };

  // 5. Handle File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = async () => {
      await burnGeotagWatermark(img, coords);
    };
    img.src = URL.createObjectURL(file);
  };

  // 6. Retake Snapshot
  const handleRetake = () => {
    setCapturedImage(null);
    setWatermarkedBlob(null);
    if (useLiveCamera) {
      startCamera();
    }
  };

  // 7. Submit Geotagged Report
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!capturedImage) {
      alert("Please capture or upload an image first.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("lat", coords.lat.toString());
      formData.append("lng", coords.lng.toString());
      formData.append("accuracy", coords.accuracy.toString());
      formData.append("reporterType", reporterType);
      formData.append("incidentType", incidentType);
      formData.append(
        "description",
        description.trim() || `${incidentType} observed at ${formatLat(coords.lat)}, ${formatLng(coords.lng)}.`
      );

      if (watermarkedBlob) {
        formData.append("photo", watermarkedBlob, `geotag-${Date.now()}.jpg`);
      }

      if (onReportSubmitted) {
        await onReportSubmitted(formData);
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error("Failed to submit report:", err);
      alert("Submission error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!capturedImage) return;
    const a = document.createElement("a");
    a.href = capturedImage;
    a.download = `girirakshak-geotag-${coords.lat.toFixed(4)}N-${coords.lng.toFixed(4)}E.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-panel-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/15 text-teal ring-1 ring-teal/40">
              <Camera size={18} />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
                Geotag Image Capture
                <span className="flex items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-mono text-teal ring-1 ring-teal/30">
                  <ShieldCheck size={11} /> GPS Verified
                </span>
              </h2>
              <p className="text-[11px] text-muted">Capture field observations with live GPS coordinates & forensic telemetry watermark</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-panel hover:text-ink transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Viewfinder / Photo Preview */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Viewfinder Container */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-line bg-backdrop flex items-center justify-center shadow-inner">
              {!capturedImage ? (
                useLiveCamera && !cameraError ? (
                  <>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="h-full w-full object-cover"
                    />
                    {/* Live Telemetry HUD Overlay on Viewfinder */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 text-white">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="flex items-center gap-1 text-teal font-semibold">
                          <Crosshair size={12} className="animate-spin text-teal" /> LIVE GPS LOCK
                        </span>
                        <span className="text-zinc-300">±{coords.accuracy}m</span>
                      </div>
                      <div className="mt-1 font-mono text-xs font-bold text-zinc-100">
                        {formatLat(coords.lat)} • {formatLng(coords.lng)}
                      </div>
                      {nearestInfo && (
                        <div className="mt-0.5 text-[10px] text-zinc-300 truncate">
                          Near: {nearestInfo.zone.name} ({nearestInfo.distanceKm.toFixed(1)} km)
                        </div>
                      )}
                    </div>

                    {/* Camera Switch button */}
                    <button
                      type="button"
                      onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
                      className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white backdrop-blur hover:bg-black/80 transition cursor-pointer"
                      title="Switch Camera"
                    >
                      <SwitchCamera size={16} />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Upload size={36} className="text-muted mb-2" />
                    <p className="text-sm font-medium text-ink">Upload or Drop Photo</p>
                    <p className="text-xs text-muted mt-1 max-w-xs">
                      {cameraError || "Select an image from your device to attach GPS geotag."}
                    </p>
                    <label className="mt-4 cursor-pointer inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-xs font-semibold text-white shadow hover:bg-teal/90 transition">
                      <Upload size={14} /> Browse Photo
                      <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                )
              ) : (
                <div className="relative h-full w-full group">
                  <img
                    src={capturedImage}
                    alt="Geotagged observation"
                    className="h-full w-full object-contain bg-black"
                  />
                  {isProcessingWatermark && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                      <div className="flex items-center gap-2 text-xs font-mono text-teal">
                        <RefreshCw size={14} className="animate-spin" /> Burning Geotag Watermark…
                      </div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                    <button
                      onClick={handleDownload}
                      className="rounded-lg bg-black/70 p-2 text-white hover:bg-black/90 transition backdrop-blur cursor-pointer"
                      title="Download Geotagged Photo"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Viewfinder Controls & Capture Bar */}
            <div className="flex items-center justify-between gap-2">
              {!capturedImage ? (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUseLiveCamera(!useLiveCamera);
                        setCameraError(null);
                      }}
                      className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs font-medium text-muted hover:text-ink transition cursor-pointer"
                    >
                      {useLiveCamera ? "Switch to File Upload" : "Open Camera Stream"}
                    </button>
                    {!useLiveCamera && (
                      <label className="cursor-pointer rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs font-medium text-muted hover:text-ink transition">
                        Select File
                        <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                      </label>
                    )}
                  </div>

                  {useLiveCamera && !cameraError && (
                    <button
                      type="button"
                      onClick={handleTakeSnapshot}
                      className="flex items-center gap-2 rounded-xl bg-teal px-5 py-2 text-xs font-bold text-white shadow-lg shadow-teal/20 hover:bg-teal/90 active:scale-95 transition cursor-pointer"
                    >
                      <Camera size={16} /> Snap Geotagged Photo
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5 text-xs font-mono text-teal">
                    <CheckCircle2 size={14} /> Geotag watermark generated
                  </span>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="flex items-center gap-1.5 rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-panel transition cursor-pointer"
                  >
                    <RefreshCw size={13} /> Retake / New Photo
                  </button>
                </div>
              )}
            </div>

            {/* GPS Telemetry Banner Card */}
            <div className="rounded-xl border border-line bg-panel-2 p-3.5">
              <div className="flex items-center justify-between border-b border-line/60 pb-2 mb-2.5">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-ink font-display">
                  <Compass size={14} className="text-teal" /> Live GPS Coordinates
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-faint">
                    {locationStatus}
                  </span>
                  <button
                    type="button"
                    onClick={acquireLocation}
                    disabled={isLocating}
                    className="rounded p-1 text-muted hover:text-teal transition cursor-pointer"
                    title="Refresh GPS"
                  >
                    <RefreshCw size={12} className={isLocating ? "animate-spin text-teal" : ""} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-lg bg-panel p-2 border border-line">
                  <span className="text-[9px] uppercase tracking-wider text-faint font-mono">Latitude</span>
                  <p className="font-mono text-xs font-bold text-ink mt-0.5">{formatLat(coords.lat)}</p>
                </div>
                <div className="rounded-lg bg-panel p-2 border border-line">
                  <span className="text-[9px] uppercase tracking-wider text-faint font-mono">Longitude</span>
                  <p className="font-mono text-xs font-bold text-ink mt-0.5">{formatLng(coords.lng)}</p>
                </div>
                <div className="rounded-lg bg-panel p-2 border border-line">
                  <span className="text-[9px] uppercase tracking-wider text-faint font-mono">GPS Accuracy</span>
                  <p className="font-mono text-xs font-bold text-teal mt-0.5">±{coords.accuracy} m</p>
                </div>
                <div className="rounded-lg bg-panel p-2 border border-line">
                  <span className="text-[9px] uppercase tracking-wider text-faint font-mono">Nearest Zone</span>
                  <p className="font-mono text-xs font-bold text-amber mt-0.5 truncate" title={nearestInfo?.zone?.name || "NER Grid"}>
                    {nearestInfo?.zone?.name?.split("–")[0]?.trim() || "NER Grid"}
                  </p>
                </div>
              </div>

              {/* Quick coordinate picker for testing/indoors */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted">
                <button
                  type="button"
                  onClick={() => setManualOverride(!manualOverride)}
                  className="text-teal hover:underline text-[11px] cursor-pointer"
                >
                  {manualOverride ? "Hide Manual Coordinates" : "⚙️ Pick from Monitored Hazard Zones"}
                </button>
                {nearestInfo && (
                  <span className="text-[10px] text-faint">
                    {nearestInfo.distanceKm.toFixed(2)} km from {nearestInfo.zone.name.split("–")[0]}
                  </span>
                )}
              </div>

              {manualOverride && (
                <div className="mt-2 pt-2 border-t border-line/60 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-faint block mb-1 font-mono">Set to Monitored Zone</label>
                    <select
                      className="w-full rounded bg-panel border border-line px-2 py-1 text-xs text-ink focus:outline-none focus:border-teal"
                      onChange={(e) => {
                        const z = zones.find((item) => item.id === e.target.value);
                        if (z) {
                          setCoords((prev) => ({
                            ...prev,
                            lat: z.lat,
                            lng: z.lng,
                            accuracy: 2.5,
                          }));
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Select a Hazard Zone…</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({z.state})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-1.5 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] text-faint block mb-1 font-mono">Custom Lat / Lng</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          step="0.0001"
                          value={coords.lat}
                          onChange={(e) => setCoords((prev) => ({ ...prev, lat: parseFloat(e.target.value) || 0 }))}
                          className="w-1/2 rounded bg-panel border border-line px-1.5 py-1 text-[11px] text-ink font-mono"
                        />
                        <input
                          type="number"
                          step="0.0001"
                          value={coords.lng}
                          onChange={(e) => setCoords((prev) => ({ ...prev, lng: parseFloat(e.target.value) || 0 }))}
                          className="w-1/2 rounded bg-panel border border-line px-1.5 py-1 text-[11px] text-ink font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Observation Metadata & Submit Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-panel-2 p-4">
                <h3 className="font-display text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                  <Sparkles size={14} className="text-teal" /> Observation Report Details
                </h3>

                {/* Reporter Type */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-muted mb-1.5">Reporter Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReporterType("field-official")}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium text-center transition cursor-pointer ${
                        reporterType === "field-official"
                          ? "border-teal bg-teal/15 text-teal"
                          : "border-line bg-panel text-muted hover:text-ink"
                      }`}
                    >
                      Field Official (PWD/NDRF)
                    </button>
                    <button
                      type="button"
                      onClick={() => setReporterType("citizen")}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium text-center transition cursor-pointer ${
                        reporterType === "citizen"
                          ? "border-teal bg-teal/15 text-teal"
                          : "border-line bg-panel text-muted hover:text-ink"
                      }`}
                    >
                      Citizen Observer
                    </button>
                  </div>
                </div>

                {/* Incident Type */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-muted mb-1.5">Incident Category</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value)}
                    className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-xs text-ink focus:border-teal focus:outline-none"
                  >
                    <option value="Active Landslide & Debris Flow">Active Landslide & Debris Flow</option>
                    <option value="Rockfall / Slope Crack">Rockfall / Slope Tension Crack</option>
                    <option value="Road Inundation & Culvert Block">Road Inundation & Culvert Block</option>
                    <option value="Mudslide / Saturated Soil Slump">Mudslide / Saturated Soil Slump</option>
                    <option value="Routine Slope Condition Check">Routine Slope Condition Check</option>
                  </select>
                </div>

                {/* Field Notes & Description */}
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Field Notes / Observations</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe slope conditions, road blockage, water saturation, or boulder accumulation…"
                    className="w-full rounded-lg border border-line bg-panel px-3 py-2 text-xs text-ink placeholder-faint focus:border-teal focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Geotag Verification Summary */}
              <div className="rounded-xl border border-line bg-panel p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted">
                  <span>Photo Status:</span>
                  <span className="font-mono font-medium text-ink">
                    {capturedImage ? "Ready (Watermarked)" : "Pending Capture"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Tagged Lat / Long:</span>
                  <span className="font-mono font-medium text-teal">
                    {formatLat(coords.lat)}, {formatLng(coords.lng)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Recorded Timestamp:</span>
                  <span className="font-mono text-faint">
                    {new Date(coords.timestamp).toLocaleTimeString("en-IN")} IST
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {submitSuccess ? (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-risk-low/20 border border-risk-low/40 p-3 text-xs font-semibold text-risk-low">
                  <CheckCircle2 size={16} /> Report successfully pinned to GIS Command Center!
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!capturedImage || isSubmitting || isProcessingWatermark}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal py-3 text-xs font-bold text-white shadow-lg shadow-teal/20 hover:bg-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Submitting Geotagged Report…
                    </>
                  ) : (
                    <>
                      <MapPin size={15} /> Submit Geotagged Field Report
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-line bg-panel-2 py-2 text-xs font-medium text-muted hover:text-ink transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
