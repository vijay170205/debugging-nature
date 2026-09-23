import RiskZone from "../models/RiskZone.js";
import { isDbConnected } from "../config/db.js";
import { memoryStore } from "../store/memoryStore.js";

function computeSummary(zones) {
  return {
    totalZones: zones.length,
    critical: zones.filter((z) => z.riskLevel === "critical").length,
    high: zones.filter((z) => z.riskLevel === "high").length,
    roadsBlocked: zones.filter((z) => z.roadStatus === "blocked").length,
    roadsAtRisk: zones.filter((z) => z.roadStatus === "at-risk").length,
    populationAtRisk: zones
      .filter((z) => z.riskLevel === "critical" || z.riskLevel === "high")
      .reduce((sum, z) => sum + (z.population || 0), 0),
  };
}

export async function getSummary(_req, res, next) {
  try {
    const zones = isDbConnected() ? await RiskZone.find().lean() : memoryStore.getZones();
    res.json(computeSummary(zones));
  } catch (err) {
    next(err);
  }
}
