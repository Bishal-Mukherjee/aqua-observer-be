import express from "express";
import {
  getSighting,
  getAllSightings,
  postSighting,
} from "@/controllers/sighting";

const router = express.Router();

router.get("/", getAllSightings);
router.get("/:id", getSighting);
router.post("/", postSighting);

export default router;
