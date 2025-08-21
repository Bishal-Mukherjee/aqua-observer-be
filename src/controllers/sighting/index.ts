import { Request, Response } from "express";
import { pool } from "@/config/db";

export const postSighting = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { type } = req.params;

    const query = await pool.query(
      `INSERT INTO sightings (submitted_by, observed_at, latitude, longitude, altitude, 
	  provider, village_or_ghat, district, block, water_body_condition, weather_condition,
	   water_body, threats, fishing_gears, images, notes, submission_context) 
	   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
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
        req.body.waterBodyCondition,
        req.body.weatherCondition,
        req.body.waterBody,
        req.body.threats,
        req.body.fishingGears,
        req.body.images,
        req.body.notes,
        type,
      ],
    );

    const species = req.body.species || [];
    for (const spec of species) {
      const { adult, adultMale, adultFemale, subAdult } = spec.ageGroup || {};
      await pool.query(
        `INSERT INTO sighting_species (sighting_id, species, adult, subadult, adult_male, adult_female) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          query.rows[0].id,
          spec.type,
          adult || 0,
          subAdult || 0,
          adultMale || 0,
          adultFemale || 0,
        ],
      );
    }

    res.status(201).json({ message: "Observation created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create observation" });
  }
};

export const getAllSightings = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;

    const speciesQuery = await pool.query("SELECT * FROM species");
    const speciesMap = new Map();

    speciesQuery.rows.forEach((species) => {
      speciesMap.set(species.value, species.age_group);
    });

    const query = await pool.query(
      `SELECT json_agg(
         json_build_object(
           'id', o.id,
		   'observedAt', o.observed_at,
           'latitude', o.latitude,
           'longitude', o.longitude,
           'altitude', o.altitude,
           'provider', o.provider,
           'waterBody', o.water_body,
           'waterBodyCondition', o.water_body_condition,
           'weatherCondition', o.weather_condition,
           'villageOrGhat', o.village_or_ghat,
           'district', o.district,
           'block', o.block,
           'threats', o.threats,
           'fishingGears', o.fishing_gears,
           'species', (
             SELECT json_agg(
               json_build_object(
                 'type', os.species,
                 'adult', os.adult,
                 'subadult', os.subadult,
                 'adultMale', os.adult_male,
                 'adultFemale', os.adult_female
               )
             )
             FROM sighting_species os
             WHERE os.sighting_id = o.id
           ),
           'images', o.images,
           'notes', o.notes,
		   'type', o.submission_context,
		   'submittedAt', o.submitted_at,
           'submittedBy', json_build_object(
             'name', u.name,
             'phoneNumber', u.phone_number
           )
         )
       ) AS results
       FROM sightings o
       JOIN users u ON o.submitted_by = u.id
       WHERE o.submitted_by = $1`,
      [id],
    );

    const sightings = query.rows[0]?.results?.map((sighting: any) => {
      const sightingSpecies = sighting.species.map((spec: any) => {
        if (speciesMap.get(spec.type) === "duo") {
          return {
            type: spec.type,
            adult: spec.adult || 0,
            subAdult: spec.subadult || 0,
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
        ...sighting,
        species: sightingSpecies,
      };
    });

    res.status(200).json({
      message: "Sightings retrieved successfully",
      result: sightings || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve sightings" });
  }
};

export const getSightingsByType = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { type } = req.params;

    const speciesQuery = await pool.query("SELECT * FROM species");
    const speciesMap = new Map();

    speciesQuery.rows.forEach((species) => {
      speciesMap.set(species.value, species.age_group);
    });

    const query = await pool.query(
      `SELECT json_agg(
         json_build_object(
           'id', o.id,
           'observedAt', o.observed_at,
           'latitude', o.latitude,
           'longitude', o.longitude,
           'altitude', o.altitude,
           'provider', o.provider,
           'waterBody', o.water_body,
           'waterBodyCondition', o.water_body_condition,
           'weatherCondition', o.weather_condition,
           'villageOrGhat', o.village_or_ghat,
           'district', o.district,
           'block', o.block,
           'threats', o.threats,
           'fishingGears', o.fishing_gears,
           'species', (
             SELECT json_agg(
               json_build_object(
                 'type', os.species,
                 'adult', os.adult,
                 'subadult', os.subadult,
                 'adultMale', os.adult_male,
                 'adultFemale', os.adult_female
               )
             )
             FROM sighting_species os
             WHERE os.sighting_id = o.id
           ),
           'images', o.images,
           'notes', o.notes,
		   'submittedAt', o.submitted_at,
           'submittedBy', json_build_object(
             'name', u.name,
             'phoneNumber', u.phone_number
           )
         )
       ) AS results
       FROM sightings o
       JOIN users u ON o.submitted_by = u.id
       WHERE o.submitted_by = $1 AND o.submission_context = $2`,
      [id, type],
    );

    const sightings = query.rows[0]?.results?.map((sighting: any) => {
      const sightingSpecies = sighting.species.map((spec: any) => {
        if (speciesMap.get(spec.type) === "duo") {
          return {
            type: spec.type,
            adult: spec.adult || 0,
            subAdult: spec.subadult || 0,
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
        ...sighting,
        species: sightingSpecies,
      };
    });

    res.status(200).json({
      message: "Sightings retrieved successfully",
      result: sightings || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve sightings" });
  }
};
