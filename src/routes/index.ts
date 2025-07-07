import express from "express";
import authRoutes from "@/routes/auth";
import userRoutes from "@/routes/user";
import sightingRoutes from "@/routes/sighting";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/sighting", sightingRoutes);

export default router;
