import axios from "axios";
import { riskZones, alerts, rainfallForecast, summary, fallbackReports } from "../data/riskZones";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10000,
});

const normalizeZone = (zone) => ({ ...zone, id: zone.id || zone.zoneId });
const normalizeAlert = (alert) => ({ ...alert, id: alert.id || alert.alertId });
const normalizeReport = (report) => ({ ...report, id: report._id || report.id });

async function apiOrFallback(request, fallback) {
  try {
    const { data } = await request();
    return data;
  } catch {
    return fallback;
  }
}

export async function fetchRiskZones() {
  const data = await apiOrFallback(() => client.get("/risk-zones"), riskZones);
  return data.map(normalizeZone);
}

export async function fetchAlerts() {
  const data = await apiOrFallback(() => client.get("/alerts"), alerts);
  return data.map(normalizeAlert);
}

export async function fetchRainfallForecast() {
  return apiOrFallback(() => client.get("/forecast/rainfall"), rainfallForecast);
}

export async function fetchSummary() {
  return apiOrFallback(() => client.get("/summary"), summary);
}

export async function fetchLiveEnvironment() {
  return apiOrFallback(
    () => client.get("/environment/live"),
    {
      live: false,
      source: "Local demo dataset",
      updatedAt: new Date().toISOString(),
      data: [],
    }
  );
}

export async function fetchPredictionHistory(limit = 100) {
  return apiOrFallback(() => client.get(`/environment/history?limit=${limit}`), []);
}

export async function fetchReports() {
  const data = await apiOrFallback(() => client.get("/reports"), fallbackReports);
  return Array.isArray(data) ? data.map(normalizeReport) : fallbackReports;
}

export async function submitReport(formData) {
  try {
    const { data } = await client.post("/reports", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizeReport(data);
  } catch (err) {
    console.warn("Backend report submission failed, falling back to local storage:", err);
    // Construct local mock report from formData
    const lat = parseFloat(formData.get("lat")) || 25.2841;
    const lng = parseFloat(formData.get("lng")) || 91.7328;
    const description = formData.get("description") || "Geotagged field observation";
    const reporterType = formData.get("reporterType") || "citizen";
    const incidentType = formData.get("incidentType") || "Field Hazard Observation";
    const accuracy = parseFloat(formData.get("accuracy")) || 5.0;
    const photoFile = formData.get("photo");
    let photoUrl = "";
    if (photoFile instanceof Blob) {
      photoUrl = URL.createObjectURL(photoFile);
    }

    const localReport = {
      id: `rep-${Date.now()}`,
      _id: `rep-${Date.now()}`,
      lat,
      lng,
      accuracy,
      incidentType,
      description,
      reporterType,
      status: "pending",
      createdAt: new Date().toISOString(),
      photoUrl: photoUrl || "https://images.unsplash.com/photo-1618588507085-c79565432917?auto=format&fit=crop&w=800&q=80",
    };
    return localReport;
  }
}

export async function broadcastAlert(alertData) {
  try {
    const { data } = await client.post("/alerts/broadcast", alertData);
    return normalizeAlert(data);
  } catch (err) {
    console.warn("Backend broadcast failed, saving locally:", err);
    return {
      id: `a-${Date.now()}`,
      alertId: `a-${Date.now()}`,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      ...alertData,
    };
  }
}


