import Fuse from "fuse.js";

export const findBestMatch = (input: string, options: any[]) => {
  const fuse = new Fuse(options, { keys: ["label.en"], includeScore: true });
  const [best] = fuse.search(input);

  if (!best.score) {
    return { value: null, label: null, matchPercentage: 0 };
  }

  return {
    value: best.item.value,
    label: best.item.label.en,
    matchPercentage: parseFloat(((1 - best.score) * 100).toFixed(2)),
  };
};
