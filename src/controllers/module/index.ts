import { Request, Response } from "express";
import { pool } from "@/config/db";

export const getModules = async (
  req: Request<{ tier: string }>,
  res: Response,
) => {
  try {
    const { id } = req.user;
    const { tier } = req.params;

    const { rows: userQuery } = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id],
    );

    const isTierAccessible = userQuery[0].tier.localeCompare(tier) >= 0;

    if (!isTierAccessible) {
      res.status(403).json({ message: "Forbidden: Access denied" });
      return;
    }

    const { rows: modulesQuery } = await pool.query(
      `SELECT json_agg (json_build_object(
     	'id', id,
     	'title', json_build_object(
        	'en', title_en,
        	'bn', title_bn
      	),
     	'description', json_build_object(
        	'en', description_en,
        	'bn', description_bn
      	),
		'url', url,
     	'tier', tier,
     	'createdAt', created_at,
		'lastUpdatedAt', last_updated_at
	   )) AS result FROM modules WHERE tier = $1;`,
      [tier],
    );

    res.status(200).json({
      message: "Modules fetched successfully",
      result: modulesQuery[0].result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
