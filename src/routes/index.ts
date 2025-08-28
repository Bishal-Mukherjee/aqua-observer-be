import express from "express";
import { authenticate } from "@/middlewares/authenticate";
import authRoutes from "@/routes/auth";
import healthRoutes from "@/routes/health";
import userRoutes from "@/routes/user";
import speciesRoutes from "@/routes/species";
import regionRoutes from "@/routes/region";
import sightingRoutes from "@/routes/sighting";
import questionRoutes from "@/routes/questions";
import tierRoutes from "@/routes/tier";
import moduleRoutes from "@/routes/module";
import reportingRoutes from "@/routes/reporting";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/health", authenticate, healthRoutes);
router.use("/user", authenticate, userRoutes);
router.use("/species", authenticate, speciesRoutes);
router.use("/region", authenticate, regionRoutes);
router.use("/reporting", authenticate, reportingRoutes);
router.use("/sighting", authenticate, sightingRoutes);
router.use("/question", authenticate, questionRoutes);
router.use("/tier", authenticate, tierRoutes);
router.use("/module", moduleRoutes);

export { router };
