import express from "express";
import {
  getSighting,
  getSightings,
  postSighting,
} from "@/controllers/sighting";

const router = express.Router();

router.get("/", getSightings);
router.get("/:id", getSighting);
router.post("/", postSighting);

export default router;
