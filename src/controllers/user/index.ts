import { Request, Response } from "express";
import { pool } from "@/config/db";
import { toCamelCase } from "@/utils/strings";

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const query = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

    if (query.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { password, ...user } = query.rows[0];

    // Convert snake_case to camelCase
    const formattedResult = Object.fromEntries(
      Object.entries(user).map(([key, value]) => {
        return [toCamelCase(key), value];
      }),
    );

    res.status(200).json({
      message: "User details fetched successfully",
      result: formattedResult,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { address, name, gender, profilePicUrl } = req.body;

    const fields: string[] = [];
    const values: string[] = [];
    let index = 1;

    if (name) {
      fields.push(`name = $${index++}`);
      values.push(name);
    }

    if (address) {
      fields.push(`address = $${index++}`);
      values.push(address);
    }

    if (gender) {
      fields.push(`gender = $${index++}`);
      values.push(gender);
    }

    if (profilePicUrl) {
      fields.push(`profile_pic_url = $${index++}`);
      values.push(profilePicUrl);
    }

    if (fields.length === 0) {
      res.status(400).json({ message: "No valid fields to update" });
      return;
    }

    values.push(id);

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`;
    const result = await pool.query(query, values);

    const { password, ...user } = result.rows[0];

    // Convert snake_case to camelCase
    const formattedResult = Object.fromEntries(
      Object.entries(user).map(([key, value]) => {
        return [toCamelCase(key), value];
      }),
    );

    res.status(200).json({
      message: "User details updated successfully",
      result: formattedResult,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
