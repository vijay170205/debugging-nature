import { riskZones, alerts, rainfallForecast } from "../data/seedData.js";

// Fallback data store used whenever MongoDB isn't connected. Keeps the same
// field shape as the Mongoose models so controllers don't need to branch
// their response formatting — only where the data comes from.
let zones = riskZones.map((z) => ({ ...z }));
let alertList = alerts.map((a) => ({ ...a }));
let reports = [];
let reportSeq = 1;
let predictionHistory = [];

export const memoryStore = {
  getZones: () => zones,
  getAlerts: () => alertList,
  getForecast: () => rainfallForecast,

  addPredictionHistory: (items) => { predictionHistory = [...items.map(x => ({ ...x, recordedAt: new Date().toISOString() })), ...predictionHistory].slice(0, 1000); },
  getPredictionHistory: (limit = 100) => predictionHistory.slice(0, limit),

  addAlert: (alert) => {
    alertList = [alert, ...alertList];
    return alert;
  },

  getReports: () => reports,
  addReport: (report) => {
    const withId = { _id: `r${reportSeq++}`, createdAt: new Date().toISOString(), ...report };
    reports = [withId, ...reports];
    return withId;
  },
};
