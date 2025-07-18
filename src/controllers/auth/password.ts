import { Request, Response } from "express";
import { genSalt, hash } from "bcrypt";
import { pool } from "@/config/db";
import { generateOTP } from "@/utils/numbers";
import {
  forgotPasswordSchema,
  validateOtpSchema,
  resetPasswordSchema,
} from "@/controllers/auth/validations";

export const forgotPassword = async (
  req: Request<{}, {}, { phoneNumber: string }>,
  res: Response,
) => {
  try {
    const { error } = forgotPasswordSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: "Validation error",
        message: error.details[0].message,
      });
      return;
    }

    const { phoneNumber } = req.body;

    const query = await pool.query(
      "SELECT * FROM users WHERE phone_number = $1",
      [phoneNumber],
    );

    if (query.rows.length === 0) {
      res.status(404).json({ message: "Invalid phone number" });
      return;
    }

    const otp = generateOTP();

    const saveOtpQuery = await pool.query(
      "INSERT INTO one_time_password (code) VALUES ($1) RETURNING *",
      [otp],
    );

    // TODO: Send OTP to user via SMS

    res
      .status(200)
      .json({ message: "OTP sent successfully", result: saveOtpQuery.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const validateOtp = async (req: Request, res: Response) => {
  try {
    const { error } = validateOtpSchema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: "Validation error",
        message: error.details[0].message,
      });
      return;
    }

    const { id, code } = req.body;

    const query = await pool.query(
      "SELECT * FROM one_time_password WHERE id = $1 AND code = $2",
      [id, code],
    );

    if (query.rows.length === 0) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }

    const now = new Date();
    const { created_at } = query.rows[0];

    // should expire in 10 mins
    if (now.getTime() - created_at.getTime() > 10 * 60 * 1000) {
      res.status(400).json({ message: "OTP has expired" });
      return;
    }

    await pool.query("DELETE FROM one_time_password WHERE id = $1", [id]);

    res.status(200).json({ message: "OTP validated successfully" });
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
