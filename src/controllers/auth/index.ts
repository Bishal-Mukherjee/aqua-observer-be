import { Request, Response } from "express";
import { genSalt, hash, compare, compareSync } from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "@/config/db";
import { config } from "@/config/config";
import {
  signinSchema,
  signupSchema,
  refreshTokenSchema,
  logoutSchema,
} from "@/controllers/auth/validations";

export const signup = async (
  req: Request<{}, {}, { name: string; phoneNumber: string; password: string }>,
  res: Response<{
    error?: string;
    message: string;
    result?: { accessToken: string; refreshToken: string };
  }>,
): Promise<void> => {
  try {
    const { error } = signupSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: "Validation error",
        message: error.details[0].message,
      });
      return;
    }

    const { name, phoneNumber, password } = req.body;

    const query = await pool.query(
      "SELECT * FROM users WHERE phone_number = $1",
      [phoneNumber],
    );

    if (query.rows.length > 0) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    const userQuery = await pool.query(
      "INSERT INTO users (name, phone_number, password) VALUES ($1, $2, $3) RETURNING id",
      [name, phoneNumber, hashedPassword],
    );

    const accessToken = jwt.sign(
      {
        id: userQuery.rows[0].id,
      },
      config.jwtSecret,
      {
        expiresIn: "1d",
      },
    );

    const refreshToken = crypto.randomBytes(32).toString("hex");
    const refreshTokenHash = await hash(refreshToken, 10);

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at) VALUES ($1, $2, $3, NOW())",
      [
        userQuery.rows[0].id,
        refreshTokenHash,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ],
    );

    res.status(201).json({
      message: "User signed up successfully",
      result: {
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to signup user" });
  }
};

export const signin = async (
  req: Request<
    {},
    {},
    { phoneNumber: string; password: string; expiresIn?: string }
  >,
  res: Response<{
    error?: string;
    message: string;
    result?: {
      accessToken: string;
      refreshToken: string;
    };
  }>,
) => {
  try {
    const { error } = signinSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: "Validation error",
        message: error.details[0].message,
      });
      return;
    }

    const {
      phoneNumber,
      password,
      expiresIn = "1d", // TODO: Remove this
    } = req.body;

    const query = await pool.query(
      "SELECT id, password FROM users WHERE phone_number = $1",
      [phoneNumber],
    );

    if (query.rows.length === 0) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const user = query.rows[0];

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
      },
      config.jwtSecret,
      {
        expiresIn: expiresIn as any, // TODO: Remove this
      },
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString("hex");
    const refreshTokenHash = await hash(refreshToken, 10);

    // Save refresh token
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at) 
		 VALUES ($1, $2, $3, NOW())`,
      [
        user.id,
        refreshTokenHash,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ],
    );

    // Clean up old refresh tokens for this user
    await pool.query(
      "DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()",
      [user.id],
    );

    res.status(200).json({
      message: "User signed in successfully",
      result: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to signin user" });
  }
};

export const refreshToken = async (
  req: Request<{}, {}, { refreshToken: string }>,
  res: Response<{
    message: string;
    error?: string;
    result?: string;
  }>,
) => {
  try {
    const { error } = refreshTokenSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: "Validation error",
        message: error.details[0].message,
      });
      return;
    }

    const { refreshToken } = req.body;

    // Find and validate refresh token
    const tokenQuery = await pool.query(
      `SELECT rt.user_id, rt.token_hash, rt.expires_at
       FROM refresh_tokens rt
       WHERE rt.expires_at > NOW() AND rt.is_revoked = FALSE`,
    );

    // Verify token hash matches
    const validToken = tokenQuery.rows.find((row) =>
      compareSync(refreshToken, row.token_hash),
    );

    if (!validToken) {
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        id: validToken.user_id,
      },
      config.jwtSecret,
      {
        expiresIn: "1d",
      },
    );

    // Rotate refresh token for better security
    res
      .status(200)
      .json({ message: "Token refreshed successfully", result: accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to refresh token" });
  }
};

export const logout = async (
  req: Request<{}, {}, { refreshToken: string }>,
  res: Response<{
    message: string;
    error?: string;
  }>,
) => {
  try {
    const { error } = logoutSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: "Validation error",
        message: "Invalid access token",
      });
      return;
    }

    const { refreshToken } = req.body;

    const tokenQuery = await pool.query(
      `SELECT rt.user_id, rt.token_hash, rt.expires_at
		 FROM refresh_tokens rt
		 WHERE rt.expires_at > NOW() AND rt.is_revoked = FALSE`,
    );

    const validToken = tokenQuery.rows.find((row) =>
      compareSync(refreshToken, row.token_hash),
    );

    await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [
      validToken.user_id,
    ]);

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to logout user" });
  }
};
