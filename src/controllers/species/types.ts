export interface SpeciesCause {
  species: string;
  causalities: Array<{
    label: {
      [language: string]: string;
    };
    value: string;
    image: string;
  }>;
}

export interface Species {
  label: {
    [language: string]: string;
  };
  value: string;
  image: string;
  ageGroup: string;
  lastUpdatedAt: string;
  causes?: SpeciesCause[]; // Optional field for causalities
}
