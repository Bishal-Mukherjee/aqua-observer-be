import express from "express";
import {
  getAllReportings,
  getReportingsByType,
  postReporting,
} from "@/controllers/reporting";

const router = express.Router();

router.get("/", getAllReportings);
router.get("/:type", getReportingsByType);
router.post("/:type", postReporting);

export default router;
