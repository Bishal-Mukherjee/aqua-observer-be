import express from "express";
import { authenticate } from "@/middlewares/authenticate";
import { getModules, getOnboardingModules } from "@/controllers/module";

const router = express.Router();

router.get("/tier/:tier", authenticate, getModules);
router.get("/onboarding-modules", getOnboardingModules);

export default router;
