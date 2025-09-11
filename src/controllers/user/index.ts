import { Request, Response } from "express";
import { pool } from "@/config/db";
import { ACTIVE } from "@/constants/constants";

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

    const { rows: questionsRows } = await pool.query(
      `SELECT MAX(last_updated_at) AS lastUpdatedAt FROM questions`,
    );
    const questionsLastUpdatedAt = questionsRows[0].lastupdatedat;

    const { rows: speciesRows } = await pool.query(
      `SELECT MAX(last_updated_at) AS lastUpdatedAt FROM species`,
    );
    const speciesLastUpdatedAt = speciesRows[0].lastupdatedat;

    const { rows: modulesRows } = await pool.query(
      `SELECT MAX(last_updated_at) AS lastUpdatedAt FROM modules`,
    );
    const modulesLastUpdatedAt = modulesRows[0].lastupdatedat;

    const { rows: notificationsRows } = await pool.query(
      `SELECT MAX(created_at) AS lastUpdatedAt FROM notifications WHERE recipient_role = $1`,
      [query.rows[0].role],
    );
    const notificationsLastUpdatedAt = notificationsRows[0].lastupdatedat;

    res.status(200).json({
      message: "User details fetched successfully",
      result: query.rows[0],
      config: {
        lastUpdatedAt: {
          questions: questionsLastUpdatedAt,
          species: speciesLastUpdatedAt,
          modules: modulesLastUpdatedAt,
          notifications: notificationsLastUpdatedAt,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateActivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;

    const query = await pool.query(`SELECT status FROM users WHERE id = $1`, [
      id,
    ]);

    if (query.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (query.rows[0].status === ACTIVE) {
      res.status(200).json({ message: "User is already activated" });
      return;
    }

    await pool.query(`UPDATE users SET status = $1 WHERE id = $2`, [
      ACTIVE,
      id,
    ]);

    res.status(200).json({ message: "User activated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
