import express from "express";
import { getSubmissions } from "@/controllers/submission";

const router = express.Router();

router.get("/", getSubmissions);

export default router;
