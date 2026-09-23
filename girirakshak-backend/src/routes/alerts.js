import { Router } from "express";
import { getAlerts, broadcastAlert } from "../controllers/alertController.js";

const router = Router();
router.get("/", getAlerts);
router.post("/broadcast", broadcastAlert);
router.post("/", broadcastAlert);
export default router;
