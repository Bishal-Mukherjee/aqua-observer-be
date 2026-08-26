import { Request, Response } from "express";
import { pool } from "@/config/db";
import {
  LabelOption,
  OptionKey,
  QuestionRow,
  DataObject,
  FormattedQuestion,
} from "@/controllers/question/types";
import { speciesAgeGroups, confirmationOptions } from "@/constants/constants";
import { getStaticLookup } from "@/utils/static-lookup";
import { geocodeAddress } from "@/controllers/region";
import { prepareSightingData } from "@/controllers/sighting/helpers";
import { postPublicSightingSchema } from "@/controllers/public-sighting/validations";
import { PublicSightingReqBody } from "@/controllers/public-sighting/types";

export const getSightingQuestions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const questionTypeParam = "sighting";
    const typeInUpperCase = questionTypeParam.toUpperCase();

    const [
      threatsData,
      fishingGearsData,
      channelTypesData,
      waterBodiesData,
      waterBodyConditionData,
      weatherConditionData,
      questionsQuery,
    ] = await Promise.all([
      getStaticLookup("disturbances"),
      getStaticLookup("fishing_gears"),
      getStaticLookup("channel_types"),
      getStaticLookup("water_bodies"),
      getStaticLookup("water_body_conditions"),
      getStaticLookup("weather_conditions"),
      pool.query(
        "SELECT index, topic, label_en, label_bn, option_key, type, mode, is_optional FROM questions WHERE contexts @> $1::text[]",
        [[typeInUpperCase]],
      ),
    ]);

    const dataObj: DataObject = {
      threats: threatsData,
      fishing_gears: fishingGearsData,
      water_bodies: waterBodiesData,
      water_body_conditions: waterBodyConditionData,
      weather_conditions: weatherConditionData,
      yes_no: confirmationOptions,
      channel_types: channelTypesData,
    };

    const appendOptions = (
      optionKey: string | null,
      options: LabelOption[] | null,
    ): { optionKey: string; options: LabelOption[] } | undefined => {
      if (options && options.length > 0) {
        return { optionKey: optionKey!, options };
      }

      if (optionKey && !options) {
        return { optionKey, options: [] };
      }

      return undefined;
    };

    const questions: FormattedQuestion[] = (
      questionsQuery.rows as QuestionRow[]
    )
      .sort((a, b) => a.index - b.index)
      .map((question): FormattedQuestion => {
        const optionKey: OptionKey = question.option_key;
        const optionsObj = appendOptions(optionKey, dataObj[optionKey]);

        const baseQuestion: FormattedQuestion = {
          topic: question.topic,
          label: {
            en: question.label_en,
            bn: question.label_bn,
          },
          type: question.type,
          mode: question.mode,
          isOptional: question.is_optional,
        };

        if (optionsObj) {
          return {
            ...baseQuestion,
            ...optionsObj,
          };
        }

        return baseQuestion;
      });

    res.status(200).json({
      message: "Questions fetched successfully",
      result: {
        questions,
        speciesAgeGroups,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const postPublicSighting = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { error } = postPublicSightingSchema.validate(req.body);

  if (error) {
    res
      .status(400)
      .json({ error: "Validation error", message: error.details[0].message });
    return;
  }

  const type = "OLD_SIGHTING";
  const body = req.body as PublicSightingReqBody;

  const client = await pool.connect();

  const anonymousUserId = await client.query(
    "SELECT id FROM users WHERE config->>'isAnonymous' = 'true'",
  );

  if (!anonymousUserId.rows[0]?.id) {
    res.status(400).json({ error: "Anonymous user not found" });
    return;
  }

  let geocodeResult;

  try {
    const address = [body.villageOrGhat, body.block, body.district]
      .filter(Boolean)
      .join(", ");

    geocodeResult = await geocodeAddress(address);
  } catch (err) {
    console.error("Error resolving location for public sighting:", err);
    res.status(400).json({
      error:
        err instanceof Error
          ? err.message
          : "Unable to resolve location for the given address",
    });
    return;
  }

  const { lat, lng, state } = geocodeResult;

  if (!lat || !lng) {
    res
      .status(400)
      .json({ error: "Unable to resolve coordinates for the given location" });
    return;
  }

  try {
    const { weatherCondition, waterBody } = prepareSightingData(body);

    await client.query("BEGIN");

    const query = await client.query(
      `INSERT INTO sightings (submitted_by, observed_at, latitude, longitude,
	  village_or_ghat, landmark, district, block, state, water_body_condition, weather_condition,
	   water_body, threats, fishing_gears, images, notes, submission_context)
	   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
      [
        anonymousUserId.rows[0]?.id,
        body.observedAt,
        lat,
        lng,
        body.villageOrGhat,
        body.landmark,
        body.district,
        body.block,
        state,
        body.waterBodyCondition,
        weatherCondition,
        waterBody,
        body.threats,
        body.fishingGears || [],
        body.images || [],
        body.notes,
        type,
      ],
    );

    const sightingId = query.rows[0]?.id;

    if (!sightingId) {
      throw new Error("Failed to create sighting record");
    }

    const species = body.species || [];

    if (species.length > 0) {
      await Promise.all(
        species.map(async (spec) => {
          const { adult, adultMale, adultFemale, subAdult, unidentified } =
            spec.ageGroup || {};

          return client.query(
            `INSERT INTO sighting_species (sighting_id, species, adult, sub_adult, adult_male, adult_female, unidentified)
			 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              sightingId,
              spec.type,
              adult || 0,
              subAdult || 0,
              adultMale || 0,
              adultFemale || 0,
              unidentified || 0,
            ],
          );
        }),
      );
    }

    await client.query("COMMIT");

    res.status(201).json({ message: "Sighting created successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to create sighting" });
  } finally {
    client.release();
  }
};
