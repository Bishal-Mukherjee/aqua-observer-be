import express from "express";
import { getAllQuestions } from "@/controllers/question";

const router = express.Router();

router.get("/:type", getAllQuestions);

export default router;
