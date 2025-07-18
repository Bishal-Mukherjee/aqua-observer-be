import express from "express";
import { authenticate } from "@/middlewares/authenticate";
import { getResource } from "@/controllers/resource";

const router = express.Router();

router.get("/:resource/:file", authenticate, getResource);

export default router;
