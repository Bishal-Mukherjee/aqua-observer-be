import { Request, Response } from "express";
import { pool } from "@/config/db";
import { redisClient } from "@/config/redis";
import { DistrictBlocks, Question } from "@/controllers/question/types";

export const getAllQuestions = async (req: Request, res: Response) => {
  try {
    const cacheKey = "question_set:v1";
    const cachedData = await redisClient.get(cacheKey);

    const speciesQuery = await pool.query(`
        SELECT json_agg(
          json_build_object(
            'label', json_build_object('en', label_en, 'bn', label_bn),
            'value', value,
            'adultImg', adult_img,
            'subAdultImg', sub_adult_img
          )
        ) AS species
        FROM species
      `);

    if (cachedData) {
      const cachedQuestions: Question[] = JSON.parse(cachedData);

      const questions = cachedQuestions.map((q) => {
        if (q.option_key === "species") {
          return { ...q, options: speciesQuery.rows[0].species };
        }
        return q;
      });

      res.status(200).json({
        message: "Questions fetched successfully",
        result: questions,
      });
      return;
    }

    const [
      districtData,
      dangersData,
      fishingGearsData,
      waterBodiesData,
      waterBodyConditionData,
      weatherConditionData,
      questionsQuery,
    ] = await Promise.all([
      redisClient.json.get("districts"),
      redisClient.json.get("dangers"),
      redisClient.json.get("fishing_gears"),
      redisClient.json.get("water_bodies"),
      redisClient.json.get("water_body_conditions"),
      redisClient.json.get("weather_conditions"),
      pool.query("SELECT * FROM questions"),
    ]);

    const dataObj = {
      districts: districtData,
      dangers: dangersData,
      fishing_gears: fishingGearsData,
      water_bodies: waterBodiesData,
      water_body_conditions: waterBodyConditionData,
      weather_conditions: weatherConditionData,
      species: speciesQuery.rows[0].species,
    };

    const allQuestions = questionsQuery.rows
      .sort((a, b) => a.index - b.index)
      .map((question) => {
        const { option_key } = question;
        const options =
          option_key && option_key !== "species"
            ? dataObj[option_key as keyof typeof dataObj]
            : null;

        return {
          topic: question.topic,
          label: {
            en: question.label_en,
            bn: question.label_bn,
          },
          ...(option_key ? { option_key } : {}),
          ...(options ? { options } : {}),
          type: question.type,
          isOptional: question.is_optional,
        };
      });

    const cacheSafeQuestions = allQuestions.map((q) =>
      q.option_key === "species" ? { ...q, options: null } : q,
    );

    await redisClient.set(cacheKey, JSON.stringify(cacheSafeQuestions), {
      EX: 604800, // 7 days (60 * 60 * 24 * 7)
    });

    res.status(200).json({
      message: "Questions fetched successfully",
      result: allQuestions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBlocks = async (req: Request, res: Response) => {
  try {
    const { district } = req.params;

    const blocks = (await redisClient.json.get(
      "blocks",
    )) as DistrictBlocks | null;

    if (blocks && blocks[district]) {
      res.status(200).json({
        message: "Blocks fetched successfully",
        result: blocks[district],
      });
      return;
    }

    res.status(200).json({ message: "Blocks not found", result: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
