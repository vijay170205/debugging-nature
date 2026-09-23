import { Router } from "express";
import { getRainfallForecast } from "../controllers/forecastController.js";

const router = Router();
router.get("/rainfall", getRainfallForecast);
export default router;
