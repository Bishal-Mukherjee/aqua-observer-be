import express from "express";
import { getUserDetails, updateUserDetails } from "@/controllers/user";

const router = express.Router();

router.get("/", getUserDetails);
router.put("/", updateUserDetails);

export default router;
