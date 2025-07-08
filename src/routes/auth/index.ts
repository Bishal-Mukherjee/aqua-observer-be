import express from "express";
import { signin, signup, refreshToken, logout } from "@/controllers/auth";

const router = express.Router();

router.post("/signin", signin);
router.post("/signup", signup);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

export default router;
