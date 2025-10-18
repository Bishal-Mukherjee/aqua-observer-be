import express from "express";
import { uploadResource } from "@/controllers/resource";
import { uploadMiddleware } from "@/utils/file-upload";

const router = express.Router();

router.post("/", uploadMiddleware, uploadResource);

export default router;
