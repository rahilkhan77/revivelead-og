import type { LlmProvider } from "@/lib/ai/types";

const DEFAULT_TIMEOUT_MS = 12_000;

export class OpenAICompatibleProvider implements LlmProvider {
  readonly name: string;

  constructor(
    private readonly options: {
      apiKey: string;
      baseUrl: string;
      model: string;
      name?: string;
      jsonObjectFormat?: boolean;
      timeoutMs?: number;
    },
  ) {
    this.name = options.name ?? "openai-compatible";
  }

  async generateJson<T>(system: string, user: string): Promise<T> {
    const text = await this.complete(system, user, true);
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as T;
  }

  async generateText(system: string, user: string): Promise<string> {
    return this.complete(system, user, false);
  }

  private async complete(system: string, user: string, json: boolean) {
    const controller = new AbortController();
    const timeoutMs = this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${this.options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.options.model,
          temperature: 0.3,
          ...(json && this.options.jsonObjectFormat !== false
            ? { response_format: { type: "json_object" } }
            : {}),
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LLM provider error (${response.status}): ${error.slice(0, 300)}`);
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("LLM provider returned an empty response.");
      return content;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("LLM provider timed out.");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
