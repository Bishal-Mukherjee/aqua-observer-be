export interface Sighting {
  id: string;
  observedAt: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  provider: string;
  waterBody: string;
  waterBodyCondition: string;
  weatherCondition: string;
  villageOrGhat: string;
  district: string;
  block: string;
  threats: string[];
  fishingGears: string[];
  species: Array<{
    type: string;
    adult: number;
    subAdult: number;
    adultMale: number;
    adultFemale: number;
  }>;
  images: string[];
  notes: string;
  type: string;
  isCached: boolean;
  submittedAt: string;
  submittedBy: {
    name: string;
    phoneNumber: string;
  };
}
