import axios from "axios";
import { config } from "@/config/config";

export const getStaticLookup = async (fileName: string) => {
  if (!fileName) return null;

  try {
    const url = `${config.supabase.url}/storage/v1/object/${config.supabase.lookupBucket}/${fileName}.json`;
    const response = await axios({
      url,
      method: "GET",
    });
    return response.data;
  } catch (err) {
    console.error("Error fetching static lookup:", err);
    return null;
  }
};
