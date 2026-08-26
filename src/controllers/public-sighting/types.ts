import { SightingReqBody } from "@/controllers/sighting/types";

export type PublicSightingReqBody = Omit<
  SightingReqBody,
  "latitude" | "longitude" | "state" | "district" | "block" | "villageOrGhat"
> & {
  district: string;
  block: string;
  villageOrGhat: string;
};
