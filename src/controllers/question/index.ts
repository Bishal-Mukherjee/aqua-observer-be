import { Request, Response } from "express";
import { pool } from "@/config/db";
import { redisClient } from "@/config/redis";
import { DistrictBlocks } from "@/controllers/question/types";

export const getAllQuestions = async (req: Request, res: Response) => {
  try {
    const [
      speciesQuery,
      districtsData,
      dangersData,
      fishingGearsData,
      waterBodiesData,
      waterBodyConditionData,
      weatherConditionData,
      questionsQuery,
    ] = await Promise.all([
      pool.query(`
        SELECT json_agg(
          json_build_object(
            'label', json_build_object('en', label_en, 'bn', label_bn),
            'value', value,
            'adultImg', adult_img,
            'subAdultImg', sub_adult_img
          )
        ) AS species
        FROM species
      `),
      redisClient.json.get("districts"),
      redisClient.json.get("dangers"),
      redisClient.json.get("fishing_gears"),
      redisClient.json.get("water_bodies"),
      redisClient.json.get("water_body_conditions"),
      redisClient.json.get("weather_conditions"),
      pool.query(`SELECT * FROM questions`),
    ]);

    const dataObj = {
      districts: districtsData,
      dangers: dangersData,
      fishing_gears: fishingGearsData,
      water_bodies: waterBodiesData,
      water_body_conditions: waterBodyConditionData,
      weather_conditions: weatherConditionData,
      species: speciesQuery.rows[0].species,
    };

    const questions = questionsQuery.rows
      .sort((a, b) => a.index - b.index)
      .map((question) => {
        const { option_key } = question;
        const options = option_key
          ? dataObj[option_key as keyof typeof dataObj]
          : null;
        return {
          topic: question.topic,
          label: {
            en: question.label_en,
            bn: question.label_bn,
          },
          ...(options ? { options } : {}),
          type: question.type,
          isOptional: question.is_optional,
        };
      });

    res.status(200).json({
      message: "Questions fetched successfully",
      result: questions,
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
