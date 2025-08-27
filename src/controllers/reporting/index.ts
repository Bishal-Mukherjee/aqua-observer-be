import { Request, Response } from "express";
import { pool } from "@/config/db";
import { Species } from "@/controllers/species/types";
import { Reporting } from "@/controllers/reporting/types";

export const getAllReportings = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;

    const speciesQuery = await pool.query("SELECT * FROM species");
    const speciesMap = new Map<string, string>();

    speciesQuery.rows.forEach((species: Species) => {
      speciesMap.set(species.value, species.ageGroup);
    });

    // Fetch reportings
    const query = await pool.query(
      `SELECT json_agg(sighting_row) AS result
       FROM (
          SELECT 
            s.id,
            s.observed_at AS "observedAt",
            s.latitude,
            s.longitude,
            s.altitude,
            s.provider,
            s.district,
            s.block,
            s.village_or_ghat AS "villageOrGhat",
            (SELECT json_agg(
                json_build_object(
                  'type', sp.species,
                  'adult', json_build_object(
                    'stranded', sp.adult_stranded,
                    'injured', sp.adult_injured,
                    'dead', sp.adult_dead
                  ),
                  'adultMale', json_build_object(
                    'stranded', sp.adult_male_stranded,
                    'injured', sp.adult_male_injured,
                    'dead', sp.adult_male_dead
                  ),
                  'adultFemale', json_build_object(
                    'stranded', sp.adult_female_stranded,
                    'injured', sp.adult_female_injured,
                    'dead', sp.adult_female_dead
                  ),
                  'subAdult', json_build_object(
                    'stranded', sp.sub_adult_stranded,
                    'injured', sp.sub_adult_injured,
                    'dead', sp.sub_adult_dead
                  )
                )
              ) FROM reporting_species sp
              WHERE sp.reporting_id = s.id
            ) AS species,
            s.images,
            s.submission_context AS "type",
            s.submitted_at AS "submittedAt",
			s.is_cached AS "isCached",
            json_build_object(
              'name', u.name,
              'phoneNumber', u.phone_number
            ) AS "submittedBy"
          FROM reportings s 
          JOIN users u ON s.submitted_by = u.id
          WHERE s.submitted_by = $1
          ORDER BY s.observed_at DESC
        ) AS sighting_row;`,
      [id],
    );

    const reportings: Reporting[] = query.rows[0]?.result?.map(
      (reporting: Reporting) => {
        const reportingSpecies = reporting.species.map((spec) => {
          if (speciesMap.get(spec.type) === "duo") {
            return {
              type: spec.type,
              adult: spec.adult || 0,
              subAdult: spec.subAdult || 0,
            };
          }
          return {
            type: spec.type,
            adultMale: spec.adultMale || 0,
            adultFemale: spec.adultFemale || 0,
            subAdult: spec.subAdult || 0,
          };
        });

        return {
          ...reporting,
          species: reportingSpecies,
        };
      },
    );

    res.status(200).json({
      message: "Reportings fetched successfully",
      result: reportings || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getReportingsByType = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { type } = req.params;

    const speciesQuery = await pool.query("SELECT * FROM species");
    const speciesMap = new Map();

    speciesQuery.rows.forEach((species) => {
      speciesMap.set(species.value, species.age_group);
    });

    const query = await pool.query(
      `SELECT json_agg(sighting_row) AS result
       FROM (
          SELECT 
            s.id,
            s.observed_at AS "observedAt",
            s.latitude,
            s.longitude,
            s.altitude,
            s.provider,
            s.district,
            s.block,
            s.village_or_ghat AS "villageOrGhat",
            (SELECT json_agg(
                json_build_object(
                  'type', sp.species,
					'adult', json_build_object(
						'stranded', sp.adult_stranded,
						'injured', sp.adult_injured,
						'dead', sp.adult_dead
					),
					'adultMale', json_build_object(
                    'stranded', sp.adult_male_stranded,
                    'injured', sp.adult_male_injured,
                    'dead', sp.adult_male_dead
                  ),
                      'adultFemale', json_build_object(
                    'stranded', sp.adult_female_stranded,
                    'injured', sp.adult_female_injured,
                    'dead', sp.adult_female_dead
                 ),
                      'subAdult', json_build_object(
                    'stranded', sp.sub_adult_stranded,
                    'injured', sp.sub_adult_injured,
                    'dead', sp.sub_adult_dead
                  )
            )) FROM reporting_species sp
              WHERE sp.reporting_id = s.id
            ) AS species,
            s.images,
			s.is_cached AS "isCached",
			s.submitted_at AS "submittedAt",
            json_build_object(
              'name', u.name,
              'phoneNumber', u.phone_number
            ) AS "submittedBy"
          FROM reportings s 
          JOIN users u ON s.submitted_by = u.id
          WHERE s.submitted_by = $1 AND s.submission_context = $2
          ORDER BY s.observed_at DESC
        ) AS sighting_row;`,
      [id, type],
    );

    const reportings = query.rows[0]?.result?.map((reporting: Reporting) => {
      const reportingSpecies = reporting.species.map((spec) => {
        if (speciesMap.get(spec.type) === "duo") {
          return {
            type: spec.type,
            adult: spec.adult || 0,
            subAdult: spec.subAdult || 0,
          };
        }
        return {
          type: spec.type,
          adultMale: spec.adultMale || 0,
          adultFemale: spec.adultFemale || 0,
          subAdult: spec.subAdult || 0,
        };
      });

      return {
        ...reporting,
        species: reportingSpecies,
      };
    });

    res.status(200).json({
      message: "Reportings fetched successfully",
      result: reportings || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const postReporting = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { type } = req.params;

    const query = await pool.query(
      `INSERT INTO reportings (submitted_by, observed_at, latitude, longitude, altitude, provider, village_or_ghat, district, block, images, submission_context, is_cached) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        id,
        req.body.observedAt,
        req.body.latitude,
        req.body.longitude,
        req.body.altitude,
        req.body.provider,
        req.body.villageOrGhat,
        req.body.district,
        req.body.block,
        req.body.images,
        type,
        req.body.isCached || false,
      ],
    );

    if (query.rows[0]?.id) {
      const species = req.body.species || [];

      for (const spec of species) {
        const { adult, adultMale, adultFemale, subAdult } = spec?.ageGroup;

        await pool.query(
          `INSERT INTO reporting_species (reporting_id, species,
		    adult_stranded, adult_injured, adult_dead,
            adult_male_stranded, adult_male_injured, adult_male_dead,
            adult_female_stranded, adult_female_injured, adult_female_dead,
            sub_adult_stranded, sub_adult_injured, sub_adult_dead) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            query.rows[0].id,
            spec.type,
            adult?.stranded || 0,
            adult?.injured || 0,
            adult?.dead || 0,
            adultMale?.stranded || 0,
            adultMale?.injured || 0,
            adultMale?.dead || 0,
            adultFemale?.stranded || 0,
            adultFemale?.injured || 0,
            adultFemale?.dead || 0,
            subAdult?.stranded || 0,
            subAdult?.injured || 0,
            subAdult?.dead || 0,
          ],
        );

        await pool.query(
          `INSERT INTO reporting_causes (reporting_id, species, cause, other_cause) VALUES ($1, $2, $3, $4)`,
          [
            query.rows[0].id,
            spec.type,
            spec?.cause || ["OTHER"],
            spec?.otherCause || null,
          ],
        );
      }
    }

    res.status(201).json({ message: "Sighting created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
