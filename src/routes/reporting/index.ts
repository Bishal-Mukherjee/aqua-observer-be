import express from "express";
import {
  getReportings,
  getReportingsByType,
  postReporting,
} from "@/controllers/reporting";

const router = express.Router();

router.get("/", getReportings);
router.get("/:type", getReportingsByType);
router.post("/:type", postReporting);

export default router;
