import express from "express";
import { authenticate } from "@/middlewares/authenticate";
import { getUserDetails, updateUserDetails } from "@/controllers/user";

const router = express.Router();

router.get("/", authenticate, getUserDetails);
router.put("/", authenticate, updateUserDetails);

export default router;
