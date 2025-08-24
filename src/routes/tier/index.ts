import express from "express";
import { authenticate } from "@/middlewares/authenticate";
import { getTiers, upgradeTier } from "@/controllers/tier";

const router = express.Router();

router.get("/", authenticate, getTiers);
router.get("/upgrade", authenticate, upgradeTier);

export default router;
