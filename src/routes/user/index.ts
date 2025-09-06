import express from "express";
import { getUserDetails, updateActivateUser } from "@/controllers/user";

const router = express.Router();

router.get("/", getUserDetails);
router.put("/activate", updateActivateUser);

export default router;
