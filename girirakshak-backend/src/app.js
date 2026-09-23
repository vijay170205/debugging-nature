import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import riskZoneRoutes from "./routes/riskZones.js";
import alertRoutes from "./routes/alerts.js";
import forecastRoutes from "./routes/forecast.js";
import summaryRoutes from "./routes/summary.js";
import reportRoutes from "./routes/reports.js";
import environmentRoutes from "./routes/environment.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") || "*" }));
  app.use(express.json());
  app.use(morgan("dev"));

  // Serve uploaded citizen-report photos/videos
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "girirakshak-backend" }));

  app.use("/api/risk-zones", riskZoneRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/forecast", forecastRoutes);
  app.use("/api/summary", summaryRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/environment", environmentRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
