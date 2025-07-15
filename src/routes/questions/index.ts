import express from "express";
import { getAllQuestions, getBlocks } from "@/controllers/question";

const router = express.Router();

router.get("/", getAllQuestions);
router.get("/blocks/:district", getBlocks);

export default router;
