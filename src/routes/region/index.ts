import express from "express";
import {
  getBlocks,
  getDistricts,
  getReverseGeocode,
} from "@/controllers/region";

const router = express.Router();

router.get("/districts", getDistricts);
router.get("/blocks", getBlocks);
router.get("/reverse-geocode", getReverseGeocode);

export default router;
