import { describe, expect, it } from "vitest";
import {
  OPENAI_DEFAULT_BASE_URL,
  OPENAI_DEFAULT_MODEL,
  PUTER_DEFAULT_MODEL,
  PUTER_OPENAI_BASE_URL,
  resolveLlmConfig,
} from "@/lib/ai/config";

describe("LLM provider selection", () => {
  it("falls back to heuristic when no keys are set", () => {
    expect(resolveLlmConfig({}).provider).toBe("heuristic");
  });

  it("uses OpenAI when LLM_PROVIDER=openai", () => {
    const config = resolveLlmConfig({
      LLM_PROVIDER: "openai",
      OPENAI_API_KEY: "sk-test",
    });
    expect(config).toMatchObject({
      provider: "openai",
      baseUrl: OPENAI_DEFAULT_BASE_URL,
      model: OPENAI_DEFAULT_MODEL,
      jsonObjectFormat: true,
    });
  });

  it("uses Puter defaults when LLM_PROVIDER=puter", () => {
    const config = resolveLlmConfig({
      LLM_PROVIDER: "puter",
      PUTER_API_KEY: "puter-token",
    });
    expect(config).toMatchObject({
      provider: "puter",
      baseUrl: PUTER_OPENAI_BASE_URL,
      model: PUTER_DEFAULT_MODEL,
      jsonObjectFormat: false,
    });
  });

  it("treats an OpenAI-compatible Puter base URL as Puter", () => {
    const config = resolveLlmConfig({
      OPENAI_API_KEY: "puter-token",
      OPENAI_BASE_URL: PUTER_OPENAI_BASE_URL,
    });
    expect(config.provider).toBe("puter");
    if (config.provider !== "heuristic") {
      expect(config.model).toBe(PUTER_DEFAULT_MODEL);
    }
  });

  it("keeps heuristic when Puter is selected but no token exists", () => {
    expect(resolveLlmConfig({ LLM_PROVIDER: "puter" }).provider).toBe("heuristic");
  });
});
