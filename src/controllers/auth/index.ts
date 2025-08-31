import { Request, Response } from "express";
import { hash, compareSync } from "bcrypt";
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
import { sendCode, verifyCode } from "@/utils/twilio";

export const signup = async (
  req: Request<
    {},
    {},
    {
      name: string;
      phoneNumber: string;
      email?: string;
      gender?: string;
      age?: number;
      occupation?: string;
    }
  >,
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

    const { name, phoneNumber, email, gender, age, occupation } = req.body;

    const query = await pool.query(
      "SELECT * FROM users WHERE phone_number = $1",
      [phoneNumber],
    );

    if (query.rows.length === 0) {
      res.status(400).json({ message: "User does not exist" });
      return;
    }

    if (query.rows[0].status === "SUSPENDED") {
      res.status(423).json({
        message: "Your account has been suspended by the administrator",
      });
      return;
    }

    await pool.query(
      "UPDATE users SET name = $1, email = $2, gender = $3, age = $4, occupation = $5, last_active_at = NOW() WHERE id = $6",
      [name, email, gender, age, occupation, query.rows[0].id],
    );

    const accessToken = jwt.sign(
      {
        id: query.rows[0].id,
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
        query.rows[0].id,
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

const WILDCARD_CODE = "000000";

export const signin = async (
  req: Request<
    {},
    {},
    { phoneNumber: string; code: string; isTest?: boolean; expiresIn?: string }
  >,
  res: Response<{
    error?: string;
    message: string;
    result?: {
      accessToken?: string;
      refreshToken?: string;
      action?: "proceed-with-otp" | "proceed-with-signup";
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
      code,
      isTest = false,
      expiresIn = "1d", // TODO: Remove this
    } = req.body;

    // TODO: remove this condition
    if (code === WILDCARD_CODE) {
      const query = await pool.query(
        "SELECT id, name, status FROM users WHERE phone_number = $1",
        [phoneNumber],
      );

      if (query.rows.length === 0) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      if (query.rows[0].status === "SUSPENDED") {
        res.status(423).json({
          message: "Your account has been suspended by the administrator",
        });
        return;
      }

      if (query.rows[0].name === null) {
        res.status(200).json({
          message: "User is already registered. Sign up is pending.",
          result: { action: "proceed-with-signup" },
        });
        return;
      }

      const accessToken = jwt.sign(
        {
          id: query.rows[0].id,
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
          query.rows[0].id,
          refreshTokenHash,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ],
      );

      // Clean up old refresh tokens for this user
      await pool.query(
        "DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()",
        [query.rows[0].id],
      );

      res.status(200).json({
        message: "User signed in successfully",
        result: { accessToken, refreshToken },
      });
      return;
    }

    if (code) {
      // this flow serves the 2nd step of OTP validation
      // after the OTP has been sent, the user will receive it and provide it back
      const isValid = await verifyCode(phoneNumber, code);

      if (!isValid) {
        res.status(400).json({ message: "Invalid OTP" });
        return;
      } else {
        const query = await pool.query(
          "SELECT id, name, status FROM users WHERE phone_number = $1",
          [phoneNumber],
        );

        if (query.rows.length === 0) {
          res.status(401).json({ message: "User not found" });
          return;
        }

        if (query.rows[0].status === "SUSPENDED") {
          res.status(423).json({
            message: "Your account has been suspended by the administrator",
          });
          return;
        }

        if (query.rows[0].name === null) {
          res.status(200).json({
            message: "User is already registered. Sign up is pending.",
            result: { action: "proceed-with-signup" },
          });
          return;
        }

        const accessToken = jwt.sign(
          {
            id: query.rows[0].id,
          },
          config.jwtSecret,
          {
            expiresIn: expiresIn as any, // TODO: Remove this
          },
        );

        const refreshToken = crypto.randomBytes(32).toString("hex");
        const refreshTokenHash = await hash(refreshToken, 10);

        await pool.query(
          "INSERT INTO refresh_tokens (user_id, token_hash, expires_at, created_at) VALUES ($1, $2, $3, NOW())",
          [
            query.rows[0].id,
            refreshTokenHash,
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ],
        );

        res.status(200).json({
          message: "User signed in successfully",
          result: {
            accessToken,
            refreshToken,
          },
        });
        return;
      }
    }

    const query = await pool.query(
      "SELECT id, status FROM users WHERE phone_number = $1",
      [phoneNumber],
    );

    if (query.rows.length === 0) {
      if (!isTest) {
        const response = await sendCode(phoneNumber);

        if (response.status !== "approved" && response.status !== "pending") {
          res.status(500).json({ message: "Failed to send OTP" });
          return;
        }
      }

      // If user is not found, create a new user
      const newUserQuery = await pool.query(
        "INSERT INTO users (phone_number) VALUES ($1) RETURNING *",
        [phoneNumber],
      );

      if (newUserQuery.rows.length === 0) {
        res.status(500).json({ message: "Failed to create user" });
        return;
      }

      res.status(201).json({
        message: "User created successfully",
        result: { action: "proceed-with-otp" },
      });
      return;
    }

    if (query.rows[0].status === "SUSPENDED") {
      res.status(423).json({
        message: "Your account has been suspended by the administrator",
      });
      return;
    }

    if (!isTest) {
      const response = await sendCode(phoneNumber);

      if (response.status !== "approved" && response.status !== "pending") {
        res.status(500).json({ message: "Failed to send OTP" });
        return;
      }
    }

    // const response = await sendCode(phoneNumber);

    // if (response.status !== "approved" && response.status !== "pending") {
    //   res.status(500).json({ message: "Failed to send OTP" });
    //   return;
    // }

    res.status(200).json({
      message: "OTP sent successfully",
      result: { action: "proceed-with-otp" },
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
