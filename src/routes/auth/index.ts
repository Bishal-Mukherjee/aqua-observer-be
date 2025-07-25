import express from "express";
import {
  signupCode,
  signupCodeVerify,
  signin,
  signup,
  refreshToken,
  logout,
} from "@/controllers/auth";
import {
  forgotPasswordCode,
  forgotPasswordCodeVerify,
  resetPassword,
} from "@/controllers/auth/password";

const router = express.Router();

router.post("/signin", signin);
router.post("/signup/generate-otp", signupCode);
router.post("/signup/verify-otp", signupCodeVerify);
router.post("/signup", signup);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password/generate-otp", forgotPasswordCode);
router.post("/forgot-password/verify-otp", forgotPasswordCodeVerify);
router.post("/reset-password", resetPassword);

export default router;
