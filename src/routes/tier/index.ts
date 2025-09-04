import express from "express";
import { getTiers, upgradeTier } from "@/controllers/tier";

const router = express.Router();

router.get("/", getTiers);
router.get("/upgrade", upgradeTier);

export default router;
