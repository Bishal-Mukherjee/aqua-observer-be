import express from "express";
import { authenticate } from "@/middlewares/authenticate";
import { getModules } from "@/controllers/module";

const router = express.Router();

router.get("/:tier", authenticate, getModules);

export default router;
