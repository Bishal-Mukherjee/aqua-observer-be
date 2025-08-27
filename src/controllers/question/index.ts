import { Request, Response } from "express";
import { pool } from "@/config/db";
import { redisClient } from "@/config/redis";
import {
  DistrictBlocks,
  LabelOption,
  OptionKey,
  QuestionRow,
  DataObject,
  FormattedQuestion,
} from "@/controllers/question/types";
import { speciesAgeGroups } from "@/constants/species-age-group";

export const getAllQuestions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const typeInUpperCase = req.params.type.toUpperCase();

    const allowedTypes = ["REPORTING", "SIGHTING"];

    if (!allowedTypes.includes(typeInUpperCase)) {
      res.status(400).json({ message: "Invalid question type" });
      return;
    }

    const questionType =
      typeInUpperCase.charAt(0) + typeInUpperCase.slice(1).toLowerCase();

    const cachedKey = `question_set:${req.params.type.toLowerCase()}`;
    const cachedData = await redisClient.get(cachedKey);

    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      res.status(200).json({
        message: `${questionType} questions fetched successfully`,
        result: { questions: parsedData, speciesAgeGroups },
      });
      return;
    }

    const [
      districtData,
      threatsData,
      fishingGearsData,
      waterBodiesData,
      waterBodyConditionData,
      weatherConditionData,
      questionsQuery,
    ] = await Promise.all([
      redisClient.json.get("districts") as Promise<LabelOption[] | null>,
      redisClient.json.get("threats") as Promise<LabelOption[] | null>,
      redisClient.json.get("fishing_gears") as Promise<LabelOption[] | null>,
      redisClient.json.get("water_bodies") as Promise<LabelOption[] | null>,
      redisClient.json.get("water_body_conditions") as Promise<
        LabelOption[] | null
      >,
      redisClient.json.get("weather_conditions") as Promise<
        LabelOption[] | null
      >,
      pool.query("SELECT * FROM questions WHERE contexts @> $1::text[]", [
        [typeInUpperCase],
      ]),
    ]);

    const dataObj: DataObject = {
      districts: districtData,
      threats: threatsData,
      fishing_gears: fishingGearsData,
      water_bodies: waterBodiesData,
      water_body_conditions: waterBodyConditionData,
      weather_conditions: weatherConditionData,
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
          isOptional: question.is_optional,
          lastUpdatedAt: question.last_updated_at,
        };

        if (optionsObj) {
          return {
            ...baseQuestion,
            ...optionsObj,
          };
        }

        return baseQuestion;
      });

    await redisClient.set(cachedKey, JSON.stringify(questions), {
      EX: 604800, // 7 days (60 * 60 * 24 * 7)
    });

    res.status(200).json({
      message: `${questionType} questions fetched successfully`,
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
