import axios from "axios";
import { Request, Response } from "express";
import { redisClient } from "@/config/redis";
import { DistrictBlocks } from "@/controllers/question/types";
import { getStaticLookup } from "@/utils/static-lookup";
import { config } from "@/config/config";
import { mapMyIndiaBaseUrl } from "@/constants/constants";

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

export const getReverseGeocode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: "Latitude and longitude are required" });
      return;
    }

    // TODO: Confirm if rounding is acceptable for the application
    const roundedLat = Number(lat).toFixed(3);
    const roundedLng = Number(lng).toFixed(3);

    const cachedData = await redisClient.get(
      `reverse_geocode:${roundedLat},${roundedLng}`,
    );

    if (cachedData) {
      res.status(200).json({
        message: "Location fetched successfully",
        result: JSON.parse(cachedData),
      });
      return;
    }

    mapMyIndiaBaseUrl.searchParams.append(
      "access_token",
      config.mapMyIndia.accessKey,
    );

    mapMyIndiaBaseUrl.searchParams.append("lat", roundedLat as string);
    mapMyIndiaBaseUrl.searchParams.append("lng", roundedLng as string);

    const response = await axios.get(mapMyIndiaBaseUrl.toString());

    if (response.data?.results?.length === 0) {
      res.status(200).json({
        message: "No address found for the given coordinates",
        result: null,
      });
      return;
    }

    await redisClient.set(
      `reverse_geocode:${roundedLat},${roundedLng}`,
      JSON.stringify(response.data.results[0]),
      { EX: 259200 }, // 72 hours
    );

    res.status(200).json({
      message: "Location fetched successfully",
      result: response.data.results[0],
    });
  } catch (error) {
    console.error("Error fetching reverse geocode:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
