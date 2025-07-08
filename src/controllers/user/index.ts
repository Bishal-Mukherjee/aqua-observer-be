import { Request, Response } from "express";
import { pool } from "@/config/db";

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const query = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

    if (query.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { password, ...user } = query.rows[0];
    res.status(200).json({ message: "User details fetched successfully", result: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUserDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { address, name, gender, proflePicUrl } = req.body;

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

    if (proflePicUrl) {
      fields.push(`profle_pic_url = $${index++}`);
      values.push(proflePicUrl);
    }

    if (fields.length === 0) {
      res.status(400).json({ message: "No valid fields to update" });
      return;
    }

    values.push(id);

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${index} RETURNING *`;
    const result = await pool.query(query, values);

    res.status(200).json({ message: "User details updated successfully", result: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
