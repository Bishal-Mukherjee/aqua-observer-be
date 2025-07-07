import express from "express";
import { authenticate } from "@/middlewares/authenticate";
import {
  getSighting,
  getAllSightings,
  postSighting,
} from "@/controllers/sighting";

const router = express.Router();

router.get("/", authenticate, getAllSightings);
router.get("/:id", authenticate, getSighting);
router.post("/", authenticate, postSighting);

export default router;
