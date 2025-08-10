import express from "express";
import {
  signin,
  signup,
  signupCode,
  refreshToken,
  logout,
} from "@/controllers/auth";
import {
  forgotPassword,
  validateOtp,
  resetPassword,
} from "@/controllers/auth/password";

const router = express.Router();

router.post("/signin", signin);
router.post("/signup", signup);
router.post("/signup/generate-otp", signupCode);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/validate-otp", validateOtp);
router.post("/reset-password", resetPassword);

export default router;
