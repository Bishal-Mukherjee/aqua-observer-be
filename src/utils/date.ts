import dayjs from "dayjs";

/**
 * Calculates the latest `lastUpdatedAt` from an array of objects.
 * @param items - Array of objects containing a `lastUpdatedAt` field.
 * @returns The latest `lastUpdatedAt` as an ISO string.
 */
export const calculateLatestLastUpdatedAt = (
  items: { lastUpdatedAt: string }[],
): string => {
  return items
    .reduce((latest, item) => {
      const itemDate = dayjs(item.lastUpdatedAt);
      return itemDate.isAfter(latest) ? itemDate : latest;
    }, dayjs(0))
    .toISOString();
};
