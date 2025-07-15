// Convert snake_case to camelCase
export const toCamelCase = (str: string) => {
  if (!str) return "";

  if (!str.includes("_")) return str;

  const splitStr = str.toLowerCase().split("_");
  return splitStr
    .map((word, index) => {
      if (index === 0) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
};
