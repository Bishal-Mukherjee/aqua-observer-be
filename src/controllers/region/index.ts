import { Request, Response } from "express";
import { DistrictBlocks } from "@/controllers/question/types";
import { getStaticLookup } from "@/utils/static-lookup";

export const getDistricts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const districts = await getStaticLookup("districts");
    if (districts) {
      res.status(200).json({
        message: "Districts fetched successfully",
        result: districts,
      });
      return;
    }

    res.status(200).json({ message: "No districts found", result: [] });
  } catch (error) {
    console.error("Error fetching districts:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getBlocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const blocks = (await getStaticLookup("blocks")) as DistrictBlocks | null;

    const { district } = req.query;

    if (blocks && district && blocks[district as any]) {
      res.status(200).json({
        message: "Blocks fetched successfully",
        result: blocks[district as any],
      });
      return;
    }

    if (blocks) {
      res.status(200).json({
        message: "Blocks fetched successfully",
        result: blocks,
      });
      return;
    }

    res.status(200).json({ message: "No blocks found", result: [] });
  } catch (error) {
    console.error("Error fetching blocks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
