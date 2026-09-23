import Alert from "../models/Alert.js";
import { isDbConnected } from "../config/db.js";
import { memoryStore } from "../store/memoryStore.js";
import { getIO } from "../socket.js";

export async function getAlerts(_req, res, next) {
  try {
    if (isDbConnected()) {
      const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50).lean();
      return res.json(alerts);
    }
    res.json(memoryStore.getAlerts());
  } catch (err) {
    next(err);
  }
}

export async function broadcastAlert(req, res, next) {
  try {
    const { zoneId, severity, message, state, channels, audience } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Alert message is required" });
    }

    const alertData = {
      alertId: `a-${Date.now()}`,
      zoneId: zoneId || "z1",
      severity: severity || "critical",
      message,
      state: state || "NER Regional",
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      channels: channels || ["CAP Feed", "SMS Broadcast"],
      audience: audience || "District Administrations & NDRF",
      createdAt: new Date().toISOString(),
    };

    let saved;
    if (isDbConnected()) {
      saved = await Alert.create(alertData);
    } else {
      saved = memoryStore.addAlert(alertData);
    }

    getIO()?.emit("newAlert", saved);
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
}
