import { Router } from "express";
import { createReport, getReports } from "../controllers/reportController.js";
import { upload } from "../middleware/upload.js";

const router = Router();
router.get("/", getReports);
router.post("/", upload.single("photo"), createReport);
export default router;
