import express from "express";
import { getAllQuestions, getBlocks } from "@/controllers/question";

const router = express.Router();

router.get("/:type", getAllQuestions);
router.get("/blocks/:district", getBlocks);

export default router;
