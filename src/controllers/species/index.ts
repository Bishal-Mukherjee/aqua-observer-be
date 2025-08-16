import { Request, Response } from "express";
import { pool } from "@/config/db";
import { redisClient } from "@/config/redis";

export const getSpecies = async (req: Request, res: Response) => {
  try {
    const speciesCauses = (await redisClient.json.get(
      "species_causes",
    )) as any[];

    const speciesQuery = await pool.query(`
        SELECT json_agg(
          json_build_object(
            'label', json_build_object('en', label_en, 'bn', label_bn),
            'value', value,
            'image', image,
			'ageGroup', age_group
          )
        ) AS species
        FROM species
      `);

    const mergedData = speciesQuery.rows[0]?.species.map((species: any) => {
      return {
        ...species,
        causes: speciesCauses?.find(
          (cause: any) => cause.species === species.value,
        )?.causalities,
      };
    });

    res.status(200).json({
      message: "Species retrieved successfully",
      result: mergedData || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve species" });
  }
};
