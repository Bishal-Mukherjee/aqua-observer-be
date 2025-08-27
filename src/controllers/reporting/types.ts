export interface Reporting {
  id: string;
  observedAt: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  provider: string;
  district: string;
  block: string;
  villageOrGhat: string;
  species: Array<{
    type: string;
    adult: {
      stranded: number;
      injured: number;
      dead: number;
    };
    adultMale: {
      stranded: number;
      injured: number;
      dead: number;
    };
    adultFemale: {
      stranded: number;
      injured: number;
      dead: number;
    };
    subAdult: {
      stranded: number;
      injured: number;
      dead: number;
    };
  }>;
  images: string[];
  type: string;
  isCached: boolean;
  submittedAt: string;
  submittedBy: {
    name: string;
    phoneNumber: string;
  };
}
