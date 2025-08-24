import { Request, Response } from "express";
import { pool } from "@/config/db";
import { redisClient } from "@/config/redis";
import { calculateLatestLastUpdatedAt } from "@/utils/date";
import { Species, SpeciesCause } from "@/controllers/species/types";

export const getSpecies = async (req: Request, res: Response) => {
  try {
    const speciesCauses = (await redisClient.json.get(
      "species_causes",
    )) as unknown as SpeciesCause[];

    const speciesQuery = await pool.query(`
        SELECT json_agg(
          json_build_object(
            'label', json_build_object('en', label_en, 'bn', label_bn),
            'value', value,
            'image', image,
            'ageGroup', age_group,
            'lastUpdatedAt', last_updated_at
          )
        ) AS species
        FROM species WHERE is_active = true
      `);

    const speciesData: Species[] = speciesQuery.rows[0]?.species || [];

    const mergedData: Species[] = speciesData
      .map((species: Species) => {
        return {
          ...species,
          causes: speciesCauses
            ? speciesCauses.filter(
                (cause: SpeciesCause) => cause.species === species.value,
              )
            : undefined,
        };
      })
      .sort((a: Species, b: Species) => a.label.en.localeCompare(b.label.en));

    const latestLastUpdatedAt = calculateLatestLastUpdatedAt(speciesData);

    res.status(200).json({
      message: "Species retrieved successfully",
      result: mergedData,
      lastUpdatedAt: latestLastUpdatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve species" });
  }
};
