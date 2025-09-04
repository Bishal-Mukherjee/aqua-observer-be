import express from "express";
import { getModules, getOnboardingModules } from "@/controllers/module";

const router = express.Router();

router.get("/tier/:tier", getModules);
router.get("/onboarding-modules", getOnboardingModules);

export default router;
