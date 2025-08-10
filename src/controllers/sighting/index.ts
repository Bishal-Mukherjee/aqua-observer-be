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
      await pool.query(
        `INSERT INTO sighting_species (sighting_id, species, adult, subadult, adult_male, adult_female) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          query.rows[0].id,
          spec.type,
          spec.adult || 0,
          spec.subadult || 0,
          spec.adultMale || 0,
          spec.adultFemale || 0,
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

    const query = await pool.query(
      `SELECT json_agg(
         json_build_object(
           'id', o.id,
           'submittedBy', o.submitted_by,
           'observedAt', o.observed_at,
           'latitude', o.latitude,
           'longitude', o.longitude,
           'altitude', o.altitude,
           'provider', o.provider,
           'villageOrGhat', o.village_or_ghat,
           'district', o.district,
           'block', o.block,
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
		   'waterBodyCondition', o.water_body_condition,
           'weatherCondition', o.weather_condition,
           'waterBody', o.water_body,
           'threats', o.threats,
           'fishingGears', o.fishing_gears,
           'images', o.images,
           'notes', o.notes,
           'submittedAt', o.submitted_at,
           'type', o.submission_context
         )
       ) AS results
       FROM sightings o
       WHERE o.submitted_by = $1`,
      [id],
    );

    const sightings = query.rows[0]?.results || [];

    res.status(200).json({
      message: "Sightings retrieved successfully",
      results: sightings,
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

    const query = await pool.query(
      `SELECT json_agg(
         json_build_object(
           'id', o.id,
           'submittedBy', o.submitted_by,
           'observedAt', o.observed_at,
           'latitude', o.latitude,
           'longitude', o.longitude,
           'altitude', o.altitude,
           'provider', o.provider,
           'villageOrGhat', o.village_or_ghat,
           'district', o.district,
           'block', o.block,
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
		   'waterBodyCondition', o.water_body_condition,
           'weatherCondition', o.weather_condition,
           'waterBody', o.water_body,
           'threats', o.threats,
           'fishingGears', o.fishing_gears,
           'images', o.images,
           'notes', o.notes,
           'submittedAt', o.submitted_at,
           'type', o.submission_context
         )
       ) AS results
       FROM sightings o
       WHERE o.submitted_by = $1 AND o.submission_context = $2`,
      [id, type],
    );

    const sightings = query.rows[0]?.results || [];

    res.status(200).json({
      message: "Sightings retrieved successfully",
      results: sightings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve sightings" });
  }
};
