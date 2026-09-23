import { Router } from "express";
import { getRiskZones, getRiskZoneById } from "../controllers/riskZoneController.js";

const router = Router();
router.get("/", getRiskZones);
router.get("/:id", getRiskZoneById);
export default router;
