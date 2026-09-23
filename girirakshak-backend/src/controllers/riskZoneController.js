import RiskZone from "../models/RiskZone.js";
import { isDbConnected } from "../config/db.js";
import { memoryStore } from "../store/memoryStore.js";

export async function getRiskZones(_req, res, next) {
  try {
    if (isDbConnected()) {
      const zones = await RiskZone.find().sort({ riskScore: -1 }).lean();
      return res.json(zones);
    }
    const zones = [...memoryStore.getZones()].sort((a, b) => b.riskScore - a.riskScore);
    res.json(zones);
  } catch (err) {
    next(err);
  }
}

export async function getRiskZoneById(req, res, next) {
  try {
    const { id } = req.params;
    if (isDbConnected()) {
      const zone = await RiskZone.findOne({ zoneId: id }).lean();
      if (!zone) return res.status(404).json({ error: "Zone not found" });
      return res.json(zone);
    }
    const zone = memoryStore.getZones().find((z) => z.zoneId === id);
    if (!zone) return res.status(404).json({ error: "Zone not found" });
    res.json(zone);
  } catch (err) {
    next(err);
  }
}
