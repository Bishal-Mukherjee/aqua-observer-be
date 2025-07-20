import { Request, Response } from "express";
import { pool } from "@/config/db";

export const getTiers = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;

    const { rows: userQuery } = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id],
    );

    const { tier: userTier } = userQuery[0];

    const tierQuery = await pool.query(
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
     	'tier', tier,
     	'createdAt', created_at,
	 	'lastUpdatedAt', last_updated_at
	   )) AS result FROM tiers;`,
    );

    if (tierQuery.rows.length === 0) {
      res.status(404).json({ message: "Tiers not found" });
      return;
    }

    const accessibleTiers = tierQuery.rows[0].result
      .filter(
        (tier: { tier: string }) => tier.tier.localeCompare(userTier) <= 0,
      )
      .sort((a: { tier: string }, b: { tier: string }) =>
        b.tier.localeCompare(a.tier),
      );

    res.status(200).json({
      message: "Tiers fetched successfully",
      result: accessibleTiers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
