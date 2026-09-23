import { Router } from "express";
import { getSummary } from "../controllers/summaryController.js";

const router = Router();
router.get("/", getSummary);
export default router;
