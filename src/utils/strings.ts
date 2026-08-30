import { promptLlm } from "@/utils/llm";

type LookupOption = {
  label: { en: string; bn?: string };
  value: string;
};

type MatchResult = {
  value: string | null;
  label: string | null;
  percentage: number;
};

const emptyMatch = (): MatchResult => ({
  value: null,
  label: null,
  percentage: 0,
});

const parseLlmJson = (raw: string): { value?: string | null } | null => {
  const jsonText = raw.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();

  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
};

export const resolveDistrictFromAddress = async (
  input: string,
  options: LookupOption[],
): Promise<MatchResult> => {
  if (!input?.trim() || !options?.length) {
    return emptyMatch();
  }

  const prompt = `You are a district resolver. You will be given a location description and you need to find the exact match from the provided list.

Input:
${input}

Districts (JSON):
${JSON.stringify(options)}

Use the input first. You may also use geographic knowledge (nearby towns, PIN codes, alternate spellings, or renamed districts) to choose the correct district.
The "value" you return MUST be one of the listed district values. Do not invent a new value.
If you cannot determine a match, return {"value":null,"label":null}.

Respond with JSON only in this shape: {"value":"<district value>","label":"<english label>"}`;

  const parsed = parseLlmJson(await promptLlm(prompt));
  const matched = options.find((option) => option.value === parsed?.value);

  if (!matched) {
    return emptyMatch();
  }

  return {
    value: matched.value,
    label: matched.label.en,
    percentage: 100,
  };
};

export const normalizeStateName = (state: string) =>
  state.trim().toUpperCase().replace(/\s+/g, "_");
