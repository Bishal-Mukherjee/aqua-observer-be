import { Request, Response } from "express";
import { pool } from "@/config/db";

export const getSighting = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { id: sightingId } = req.params;

    const searchQuery = await pool.query(
      "SELECT * FROM sightings WHERE id = $1 AND sighter_id = $2",
      [sightingId, id],
    );

    if (searchQuery.rows.length === 0) {
      res.status(404).json({ message: "Sighting not found" });
      return;
    }

    const query = await pool.query(
      `SELECT json_build_object(
  	  'longitude', s.longitude,
      'latitude', s.latitude,
      'altitude', s.altitude,
      'place', s.place,
      'district', s.district,
      'block', s.block,
      'villageOrGhat', s.village_or_ghat,
	  'waterBody', s.water_body,
	  'weatherCondition', s.weather_condition,
	  'dangers', s.dangers,
	  'waterBodyCondition', s.water_body_condition,
	  'fishingGear', s.fishing_gear,
      'species', (
        SELECT json_agg(
         json_build_object(
           'type', sp.species,
          		'adultMale', json_build_object(
            	'alive', sp.adult_male_alive,
            	'stranded', sp.adult_male_stranded,
            	'injured', sp.adult_male_injured,
            	'dead', sp.adult_male_dead
          		),
          		'adultFemale', json_build_object(
            	'alive', sp.adult_female_alive,
            	'stranded', sp.adult_female_stranded,
            	'injured', sp.adult_female_injured,
            	'dead', sp.adult_female_dead
         		),
          		'subAdult', json_build_object(
            	'alive', sp.subadult_alive,
            	'stranded', sp.subadult_stranded,
            	'injured', sp.subadult_injured,
            	'dead', sp.subadult_dead
          	)
        ))FROM sighting_species sp
      	WHERE sp.sighting_id = s.id
     	),
     	'notes', s.notes,
     	'imageUrls', s.image_urls
     	) AS result
    	FROM sightings s
     	WHERE s.id = $1 AND s.sighter_id = $2`,
      [sightingId, id],
    );

    res.status(200).json({
      message: "Sighting fetched successfully",
      result: query.rows[0].result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSightings = async (req: Request, res: Response) => {
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
    		s.place,
    		s.district,
    		s.block,
    		s.village_or_ghat AS "villageOrGhat",
    		s.water_body AS "waterBody",
    		s.weather_condition AS "weatherCondition",
    		s.water_body_condition AS "waterBodyCondition",
    		s.dangers,
    		s.fishing_gear AS "fishingGear",
    		s.notes,
    		s.image_urls AS "imageUrls",
    		s.observed_at,
			(SELECT json_agg(
        		json_build_object(
          		'type', sp.species,
          			'adultMale', json_build_object(
            		'alive', sp.adult_male_alive,
            		'stranded', sp.adult_male_stranded,
            		'injured', sp.adult_male_injured,
            		'dead', sp.adult_male_dead
          		),
          			'adultFemale', json_build_object(
            		'alive', sp.adult_female_alive,
            		'stranded', sp.adult_female_stranded,
            		'injured', sp.adult_female_injured,
            		'dead', sp.adult_female_dead
         		),
          			'subAdult', json_build_object(
            		'alive', sp.subadult_alive,
            		'stranded', sp.subadult_stranded,
            		'injured', sp.subadult_injured,
            		'dead', sp.subadult_dead
          		)
        	)) FROM sighting_species sp
      		WHERE sp.sighting_id = s.id
    		) AS species
  		FROM sightings s 
  		WHERE s.sighter_id = $1
  		ORDER BY s.observed_at DESC
		) AS sighting_row;`,
      [id],
    );

    const sightings = query.rows[0];

    res.status(200).json({
      message: "Sightings fetched successfully",
      result: sightings.result || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const postSighting = async (req: Request, res: Response) => {
  try {
    const { id } = req.user;
    const { species } = req.body;

    const query = await pool.query(
      `INSERT INTO sightings (observed_at, sighter_id, latitude, longitude, altitude, place, district, block, 
	  village_or_ghat, water_body, weather_condition, dangers, water_body_condition, fishing_gear, image_urls, notes) 
	  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
      [
        req.body.observedAt,
        id,
        req.body.latitude,
        req.body.longitude,
        req.body.altitude,
        req.body.place,
        req.body.district,
        req.body.block,
        req.body.villageOrGhat,
        req.body.waterBody,
        req.body.weatherCondition,
        req.body.dangers,
        req.body.waterBodyCondition,
        req.body.fishingGear,
        req.body.imageUrls,
        req.body.notes,
      ],
    );

    if (query.rows[0]?.id) {
      if (species.length === 0) {
        res.status(201).json({ message: "Sighting created successfully" });
        return;
      }

      for (let i = 0; i < species.length; i++) {
        await pool.query(
          `INSERT INTO sighting_species (sighting_id, species, 
		  adult_male_alive, adult_male_stranded, adult_male_injured, adult_male_dead, 
		  adult_female_alive, adult_female_stranded, adult_female_injured, adult_female_dead, 
		  subadult_alive, subadult_stranded, subadult_injured, subadult_dead) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            query.rows[0].id,
            species[i].type,
            species[i]?.adultMale?.alive || 0,
            species[i]?.adultMale?.stranded || 0,
            species[i]?.adultMale?.injured || 0,
            species[i]?.adultMale?.dead || 0,
            species[i]?.adultFemale?.alive || 0,
            species[i]?.adultFemale?.stranded || 0,
            species[i]?.adultFemale?.injured || 0,
            species[i]?.adultFemale?.dead || 0,
            species[i]?.subAdult?.alive || 0,
            species[i]?.subAdult?.stranded || 0,
            species[i]?.subAdult?.injured || 0,
            species[i]?.subAdult?.dead || 0,
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
