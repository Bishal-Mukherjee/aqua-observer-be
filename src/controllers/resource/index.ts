import axios from "axios";
import { Request, Response } from "express";
import { StorageClient } from "@supabase/storage-js";
import { config } from "@/config/config";

const STORAGE_URL = config.storageUrl;
const SERVICE_KEY = config.serviceRole;

const storageClient = new StorageClient(STORAGE_URL, {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
});

export const getResource = async (req: Request, res: Response) => {
  try {
    const { resource, file } = req.params;

    const filePath = `${resource}/${file}`;

    const { data, error } = await storageClient
      .from("secure-bucket")
      .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 1 week

    if (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
      return;
    }

    try {
      const imageRes = await axios.get(data.signedUrl, {
        responseType: "stream",
      });

      res.setHeader("Content-Type", imageRes.headers["content-type"]);
      imageRes.data.pipe(res);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
