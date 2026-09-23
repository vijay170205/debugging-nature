// Single source of truth for demo data — mirrors src/data/riskZones.js on the
// frontend so both sides agree on shape. In production this table is written
// to by the AI/ML risk-fusion engine, not hand-seeded.

export const riskZones = [
  { zoneId: "z1", name: "Sohra (Cherrapunji) – NH206 Corridor", state: "Meghalaya", lat: 25.2841, lng: 91.7328, riskLevel: "critical", riskScore: 91, rainfall24h: 212, rainfall72h: 480, soilMoisture: 88, deformationTrend: "rising", roadStatus: "blocked", population: 12400, note: "Sustained cloudburst-intensity rainfall; InSAR shows accelerating creep since Aug 26." },
  { zoneId: "z2", name: "Mawsynram Ridge Road", state: "Meghalaya", lat: 25.2971, lng: 91.5822, riskLevel: "high", riskScore: 76, rainfall24h: 168, rainfall72h: 390, soilMoisture: 81, deformationTrend: "rising", roadStatus: "at-risk", population: 8100, note: "Rainfall threshold crossed; road passable with caution." },
  { zoneId: "z3", name: "Aizawl–Thenzawl State Highway", state: "Mizoram", lat: 23.5143, lng: 92.7789, riskLevel: "high", riskScore: 71, rainfall24h: 94, rainfall72h: 260, soilMoisture: 74, deformationTrend: "stable", roadStatus: "at-risk", population: 15600, note: "Historical slide zone; slope creep within normal seasonal range." },
  { zoneId: "z4", name: "Ukhrul Hill Township", state: "Manipur", lat: 25.0466, lng: 94.3628, riskLevel: "moderate", riskScore: 52, rainfall24h: 41, rainfall72h: 140, soilMoisture: 62, deformationTrend: "stable", roadStatus: "open", population: 19700, note: "Within safe threshold; monitoring continues." },
  { zoneId: "z5", name: "Kohima–Dimapur NH29", state: "Nagaland", lat: 25.7280, lng: 94.0997, riskLevel: "moderate", riskScore: 48, rainfall24h: 38, rainfall72h: 121, soilMoisture: 58, deformationTrend: "stable", roadStatus: "open", population: 22300, note: "Primary connectivity corridor; no active concern." },
  { zoneId: "z6", name: "Along (Aalo) – Yomcha Road", state: "Arunachal Pradesh", lat: 28.1667, lng: 94.8000, riskLevel: "high", riskScore: 68, rainfall24h: 87, rainfall72h: 233, soilMoisture: 77, deformationTrend: "rising", roadStatus: "at-risk", population: 6300, note: "Recent hill-cutting for road widening; elevated susceptibility score." },
  { zoneId: "z7", name: "Gangtok–Singtam NH10", state: "Sikkim", lat: 27.2500, lng: 88.5500, riskLevel: "critical", riskScore: 88, rainfall24h: 156, rainfall72h: 410, soilMoisture: 85, deformationTrend: "rising", roadStatus: "blocked", population: 31200, note: "Multiple debris-flow reports from field officials in the last 6 hours." },
  { zoneId: "z8", name: "Haflong Hill Town", state: "Assam", lat: 25.1667, lng: 93.0167, riskLevel: "low", riskScore: 24, rainfall24h: 12, rainfall72h: 58, soilMoisture: 41, deformationTrend: "stable", roadStatus: "open", population: 40100, note: "Conditions nominal." },
  { zoneId: "z9", name: "Agartala–Ambassa Corridor", state: "Tripura", lat: 23.9364, lng: 91.8508, riskLevel: "low", riskScore: 19, rainfall24h: 9, rainfall72h: 44, soilMoisture: 37, deformationTrend: "stable", roadStatus: "open", population: 28500, note: "Conditions nominal." },
];

export const alerts = [
  { alertId: "a1", zoneId: "z1", severity: "critical", message: "Critical risk threshold crossed — road closure recommended.", time: "05:40 AM" },
  { alertId: "a2", zoneId: "z7", severity: "critical", message: "Multiple debris-flow field reports verified by PWD official.", time: "05:22 AM" },
  { alertId: "a3", zoneId: "z2", severity: "high", message: "Rainfall trigger threshold exceeded; advisory issued to district admin.", time: "05:12 AM" },
  { alertId: "a4", zoneId: "z6", severity: "high", message: "InSAR deformation velocity rising above seasonal baseline.", time: "04:55 AM" },
  { alertId: "a5", zoneId: "z3", severity: "moderate", message: "Soil moisture approaching saturation threshold.", time: "04:30 AM" },
];

export const rainfallForecast = [
  { day: "Today", mm: 96 },
  { day: "+1 day", mm: 128 },
  { day: "+2 days", mm: 84 },
  { day: "+3 days", mm: 52 },
  { day: "+4 days", mm: 31 },
];
