import { resolveLlmConfig } from "@/lib/ai/config";
import { HeuristicProvider } from "@/lib/ai/heuristic";
import { OpenAICompatibleProvider } from "@/lib/ai/openai-compatible";
import type { LlmProvider } from "@/lib/ai/types";

export function getLlmProvider(): LlmProvider {
  const config = resolveLlmConfig();
  if (config.provider === "heuristic") {
    return new HeuristicProvider();
  }

  return new OpenAICompatibleProvider({
    name: config.provider,
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    jsonObjectFormat: config.jsonObjectFormat,
  });
}
