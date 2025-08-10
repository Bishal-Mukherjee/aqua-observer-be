import express from "express";
import { authenticate } from "@/middlewares/authenticate";
import { getSpecies } from "@/controllers/species";

const router = express.Router();

router.get("/", authenticate, getSpecies);

export default router;
