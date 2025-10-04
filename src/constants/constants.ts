export const speciesAgeGroups = {
  duo: [
    {
      label: { en: "Adults", bn: "Adults" },
      value: "adult",
    },
    {
      label: { en: "Calves", bn: "Calves" },
      value: "subAdult",
    },
  ],
  trio: [
    {
      label: { en: "Adult Male", bn: "Adult Male" },
      value: "adultMale",
    },
    {
      label: { en: "Adult Female", bn: "Adult Female" },
      value: "adultFemale",
    },
    {
      label: { en: "Sub-Adults/Juveniles", bn: "Sub-Adults/Juveniles" },
      value: "subAdult",
    },
  ],
} as const;

export const LIVE_REPORTING = "LIVE_REPORTING",
  LIVE_SIGHTING = "LIVE_SIGHTING",
  UNKNOWN = "UNKNOWN",
  ONBOARDED = "ONBOARDED",
  ACTIVE = "ACTIVE";
