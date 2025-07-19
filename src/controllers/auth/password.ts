import { Request, Response } from "express";
import { genSalt, hash } from "bcrypt";
import { pool } from "@/config/db";
import { sendCode, verifyCode } from "@/utils/twilio";
import {
  signupCodeSchema as forgotPasswordCodeSchema,
  signupCodeVerifySchema as forgotPasswordCodeVerifySchema,
  resetPasswordSchema,
} from "@/controllers/auth/validations";

export const forgotPasswordCode = async (
  req: Request<{}, {}, { phoneNumber: string }>,
  res: Response,
) => {
  try {
    const { error } = forgotPasswordCodeSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: "Validation error",
        message: error.details[0].message,
      });
      return;
    }

    const { phoneNumber } = req.body;

    const response = await sendCode(phoneNumber);

    if (response.status !== "approved" && response.status !== "pending") {
      res.status(500).json({ message: "Failed to send OTP" });
      return;
    }

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const forgotPasswordCodeVerify = async (
  req: Request<{}, {}, { phoneNumber: string; code: string }>,
  res: Response,
) => {
  try {
    const { error } = forgotPasswordCodeVerifySchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: "Validation error",
        message: error.details[0].message,
      });
      return;
    }

    const { phoneNumber, code } = req.body;

    const response = await verifyCode(phoneNumber, code);

    if (response.valid) {
      res.status(200).json({ message: "OTP verified successfully" });
    } else {
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { error } = resetPasswordSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: "Validation error",
        message: error.details[0].message,
      });
      return;
    }

    const { phoneNumber, password } = req.body;

    const query = await pool.query(
      "SELECT * FROM users WHERE phone_number = $1",
      [phoneNumber],
    );

    if (query.rows.length === 0) {
      res.status(404).json({ message: "Invalid phone number" });
      return;
    }

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    await pool.query("UPDATE users SET password = $1 WHERE phone_number = $2", [
      hashedPassword,
      phoneNumber,
    ]);

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
