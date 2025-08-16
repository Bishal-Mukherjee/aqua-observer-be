import { Request, Response } from "express";
import { pool } from "@/config/db";
import { redisClient } from "@/config/redis";
import { DistrictBlocks } from "@/controllers\\question\\types";

const speciesAgeGroups = {
  duo: [
    {
      label: { en: "Adults", bn: "বয়স্ক" },
      value: "adult",
    },
    {
      label: { en: "Calves", bn: "ক্যালভেস" },
      value: "subAdult",
    },
  ],
  trio: [
    {
      label: { en: "Adult Male", bn: "বয়স্ক পুরুষ" },
      value: "adultMale",
    },
    {
      label: { en: "Adult Female", bn: "বয়স্ক মহিলা" },
      value: "adultFemale",
    },
    {
      label: { en: "Sub-Adults/Juveniles", bn: "অর্ধবয়স্ক/কিশোর" },
      value: "subAdult",
    },
  ],
} as const;

interface LabelOption {
  label: { en: string; bn: string };
  value: string;
}

type OptionKey =
  | "districts"
  | "threats"
  | "fishing_gears"
  | "water_bodies"
  | "water_body_conditions"
  | "weather_conditions";

interface QuestionRow {
  topic: string;
  label_en: string;
  label_bn: string;
  option_key: OptionKey;
  type: string;
  is_optional: boolean;
  index: number;
}

interface DataObject {
  districts: LabelOption[] | null;
  threats: LabelOption[] | null;
  fishing_gears: LabelOption[] | null;
  water_bodies: LabelOption[] | null;
  water_body_conditions: LabelOption[] | null;
  weather_conditions: LabelOption[] | null;
}

interface FormattedQuestion {
  topic: string;
  label: { en: string; bn: string };
  optionKey?: string;
  options?: LabelOption[];
  type: string;
  isOptional: boolean;
}

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
      result: { questions, speciesAgeGroups },
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
