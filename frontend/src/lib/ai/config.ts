export const PUTER_OPENAI_BASE_URL = "https://api.puter.com/puterai/openai/v1";
export const OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1";
export const OPENAI_DEFAULT_MODEL = "gpt-4.1-mini";
export const PUTER_DEFAULT_MODEL = "gpt-5.4-nano";

export type LlmProviderId = "heuristic" | "openai" | "puter";

export type ResolvedLlmConfig =
  | { provider: "heuristic" }
  | {
      provider: "openai" | "puter";
      apiKey: string;
      baseUrl: string;
      model: string;
      jsonObjectFormat: boolean;
    };

function looksLikePuterBase(url: string) {
  return url.includes("api.puter.com");
}

export function resolveLlmConfig(
  env: Record<string, string | undefined> = process.env,
): ResolvedLlmConfig {
  const requested = (env.LLM_PROVIDER ?? "").trim().toLowerCase();
  const puterKey = env.PUTER_API_KEY?.trim() || "";
  const openaiKey = env.OPENAI_API_KEY?.trim() || "";
  const baseUrl = env.OPENAI_BASE_URL?.trim() || "";
  const model = env.OPENAI_MODEL?.trim() || "";

  if (requested === "heuristic") {
    return { provider: "heuristic" };
  }

  if (requested === "puter") {
    const apiKey = puterKey || openaiKey;
    if (!apiKey) return { provider: "heuristic" };
    return {
      provider: "puter",
      apiKey,
      baseUrl: baseUrl || PUTER_OPENAI_BASE_URL,
      model: model || PUTER_DEFAULT_MODEL,
      jsonObjectFormat: false,
    };
  }

  if (requested === "openai") {
    if (!openaiKey) return { provider: "heuristic" };
    return {
      provider: "openai",
      apiKey: openaiKey,
      baseUrl: baseUrl || OPENAI_DEFAULT_BASE_URL,
      model: model || OPENAI_DEFAULT_MODEL,
      jsonObjectFormat: true,
    };
  }

  if (openaiKey && looksLikePuterBase(baseUrl)) {
    return {
      provider: "puter",
      apiKey: openaiKey,
      baseUrl,
      model: model || PUTER_DEFAULT_MODEL,
      jsonObjectFormat: false,
    };
  }

  if (openaiKey) {
    return {
      provider: "openai",
      apiKey: openaiKey,
      baseUrl: baseUrl || OPENAI_DEFAULT_BASE_URL,
      model: model || OPENAI_DEFAULT_MODEL,
      jsonObjectFormat: true,
    };
  }

  if (puterKey) {
    return {
      provider: "puter",
      apiKey: puterKey,
      baseUrl: baseUrl || PUTER_OPENAI_BASE_URL,
      model: model || PUTER_DEFAULT_MODEL,
      jsonObjectFormat: false,
    };
  }

  return { provider: "heuristic" };
}

export function getDefaultLlmModel() {
  const config = resolveLlmConfig();
  if (config.provider === "heuristic") return OPENAI_DEFAULT_MODEL;
  return config.model;
}
