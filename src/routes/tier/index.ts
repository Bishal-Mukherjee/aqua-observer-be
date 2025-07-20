import express from "express";
import { authenticate } from "@/middlewares/authenticate";
import { getTiers } from "@/controllers/tier";

const router = express.Router();

router.get("/", authenticate, getTiers);

export default router;
