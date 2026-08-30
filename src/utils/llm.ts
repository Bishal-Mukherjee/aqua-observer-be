import { Ollama } from "ollama";
import { config } from "@/config/config";

const ollama = new Ollama({
  host: config.ollama.baseUrl,
  headers: {
    Authorization: `Bearer ${config.ollama.apiKey}`,
  },
});

export const promptLlm = async (prompt: string): Promise<string> => {
  const response = await ollama.generate({
    model: config.ollama.model,
    prompt,
  });

  return response.response?.trim() ?? "";
};
