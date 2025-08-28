import express from "express";
import { getBlocks, getDistricts } from "@/controllers/region";

const router = express.Router();

router.get("/districts", getDistricts);
router.get("/blocks", getBlocks);

export default router;
