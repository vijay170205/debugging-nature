import RiskZone from "../models/RiskZone.js";
import Report from "../models/Report.js";
import { isDbConnected } from "../config/db.js";
import { memoryStore } from "../store/memoryStore.js";
import { findNearestZone } from "../utils/geo.js";
import { getIO } from "../socket.js";

export async function createReport(req, res, next) {
  try {
    const { lat, lng, description, reporterType, incidentType, accuracy } = req.body;
    if (lat === undefined || lng === undefined || !description) {
      return res.status(400).json({ error: "lat, lng and description are required" });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const zones = isDbConnected() ? await RiskZone.find().lean() : memoryStore.getZones();
    const match = findNearestZone(zones, latNum, lngNum);

    const reportData = {
      reporterType: reporterType === "field-official" ? "field-official" : "citizen",
      incidentType: incidentType || "Field Hazard Observation",
      accuracy: accuracy ? parseFloat(accuracy) : undefined,
      description,
      lat: latNum,
      lng: lngNum,
      photoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      nearestZoneId: match?.zone.zoneId,
      nearestZoneName: match?.zone.name,
      distanceKm: match?.distanceKm,
      status: "pending",
    };

    let saved;
    if (isDbConnected()) {
      saved = await Report.create(reportData);
    } else {
      saved = memoryStore.addReport(reportData);
    }

    // Push a live notification to any connected dashboards — this is the
    // real-time alert channel described in the architecture (Section 4).
    getIO()?.emit("newReport", saved);

    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
}

export async function getReports(_req, res, next) {
  try {
    if (isDbConnected()) {
      const reports = await Report.find().sort({ createdAt: -1 }).limit(100).lean();
      return res.json(reports);
    }
    res.json(memoryStore.getReports());
  } catch (err) {
    next(err);
  }
}
