import { Request, Response } from "express";
import { pool } from "@/config/db";

export const getReportings = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;

    const query = await pool.query(
      `SELECT json_agg(sighting_row) AS result
	   FROM (
  		SELECT 
    		s.id,
    		s.longitude,
    		s.latitude,
    		s.altitude,
			s.provider,
    		s.district,
    		s.block,
    		s.village_or_ghat AS "villageOrGhat",
			(SELECT json_agg(
        		json_build_object(
          		'type', sp.species,
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
            		'stranded', sp.subadult_stranded,
            		'injured', sp.subadult_injured,
            		'dead', sp.subadult_dead
          		),
				s.submission_context AS "type"
        	)) FROM reporting_species sp
      		WHERE sp.reporting_id = s.id
    		) AS species,
		    s.images,
    		s.observed_at,
			s.submission_context AS "type"
  		FROM reportings s 
  		WHERE s.submitted_by = $1
  		ORDER BY s.observed_at DESC
		) AS sighting_row;`,
      [id],
    );

    const sightings = query.rows[0];

    res.status(200).json({
      message: "Reportings fetched successfully",
      result: sightings.result || [],
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

    const query = await pool.query(
      `SELECT json_agg(sighting_row) AS result
	   FROM (
  		SELECT 
    		s.id,
    		s.longitude,
    		s.latitude,
    		s.altitude,
			s.provider,
    		s.district,
    		s.block,
    		s.village_or_ghat AS "villageOrGhat",
			(SELECT json_agg(
        		json_build_object(
          		'type', sp.species,
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
            		'stranded', sp.subadult_stranded,
            		'injured', sp.subadult_injured,
            		'dead', sp.subadult_dead
          		)
        	)) FROM reporting_species sp
      		WHERE sp.reporting_id = s.id
    		) AS species,
		    s.images,
    		s.observed_at,
			s.submission_context AS "type"
  		FROM reportings s 
  		WHERE s.submitted_by = $1 AND s.submission_context = $2
  		ORDER BY s.observed_at DESC
		) AS sighting_row;`,
      [id, type],
    );

    const reportings = query.rows[0];

    res.status(200).json({
      message: "Reportings fetched successfully",
      result: reportings.result || [],
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
      `INSERT INTO reportings (submitted_by, observed_at, latitude, longitude, altitude, provider, village_or_ghat, district, block, images, submission_context) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
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
      ],
    );

    if (query.rows[0]?.id) {
      const species = req.body.species || [];

      for (const spec of species) {
        await pool.query(
          `INSERT INTO reporting_species (reporting_id, species,
            adult_male_stranded, adult_male_injured, adult_male_dead,
            adult_female_stranded, adult_female_injured, adult_female_dead,
            subadult_stranded, subadult_injured, subadult_dead) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            query.rows[0].id,
            spec.type,
            spec?.adultMale?.stranded || 0,
            spec?.adultMale?.injured || 0,
            spec?.adultMale?.dead || 0,
            spec?.adultFemale?.stranded || 0,
            spec?.adultFemale?.injured || 0,
            spec?.adultFemale?.dead || 0,
            spec?.subAdult?.stranded || 0,
            spec?.subAdult?.injured || 0,
            spec?.subAdult?.dead || 0,
          ],
        );

        await pool.query(
          `INSERT INTO reporting_causes (reporting_id, species, cause) VALUES ($1, $2, $3)`,
          [query.rows[0].id, spec.type, spec?.cause || null],
        );
      }
    }

    res.status(201).json({ message: "Sighting created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
