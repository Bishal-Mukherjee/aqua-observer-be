import express from "express";
import {
  getAllSightings,
  getSightingsByType,
  postSighting,
} from "@/controllers/sighting";

const router = express.Router();

router.get("/", getAllSightings);
router.get("/:type", getSightingsByType);
router.post("/:type", postSighting);

export default router;
