import { Request, Response } from "express";
import { pool } from "@/config/db";

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;

    const query = await pool.query(
      `SELECT
		id,
		name,
		age,
		phone_number AS "phoneNumber",
		email,
		gender,
		role,
		tier,
		status,
		occupation,
		created_at AS "createdAt",
		last_active_at AS "lastActiveAt"
		FROM users WHERE id = $1
		`,
      [id],
    );

    if (query.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "User details fetched successfully",
      result: query.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
