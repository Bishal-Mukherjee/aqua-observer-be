import express from "express";
import { authenticate } from "@/middlewares/authenticate";
import authRoutes from "@/routes/auth";
import healthRoutes from "@/routes/health";
import userRoutes from "@/routes/user";
import sightingRoutes from "@/routes/sighting";
import questionRoutes from "@/routes/questions";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/health", authenticate, healthRoutes);
router.use("/user", authenticate, userRoutes);
router.use("/sighting", authenticate, sightingRoutes);
router.use("/question", authenticate, questionRoutes);

export { router };
