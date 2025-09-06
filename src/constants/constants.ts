export const speciesAgeGroups = {
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

export const LIVE_REPORTING = "LIVE_REPORTING",
  LIVE_SIGHTING = "LIVE_SIGHTING",
  UNKNOWN = "UNKNOWN",
  ONBOARDED = "ONBOARDED",
  ACTIVE = "ACTIVE";
