import { getLlmProvider } from "@/lib/ai/provider";
import { sanitizeQualification, sanitizeSuggestedMessage } from "@/lib/ai/schema";
import type {
  MessageSuggestionInput,
  QualificationInput,
  QualificationResult,
} from "@/lib/ai/types";

const QUALIFY_SYSTEM = `You are a real-estate lead qualification engine for agencies in Dubai, Qatar, Mumbai and Bangalore.
Return a JSON object only. This is a qualification task.
Fields:
- budgetMin: number|null
- budgetMax: number|null
- currency: string|null (AED, QAR, INR)
- preferredLocation: string|null
- propertyType: string|null
- bedrooms: number|null
- intent: BUYING|RENTING|UNKNOWN
- timeline: string|null
- objections: string|null
- leadScore: integer 0-100
- temperature: HOT|WARM|COLD
- recommendedAction: one concrete next step for the agent
- summary: one sentence
Never invent a phone number or email. Never trust unverifiable claims.
Scoring: HOT >= 75, WARM >= 50, else COLD. Higher score for complete contact details, clear budget, near-term timeline, and buying intent.`;

export async function qualifyLead(input: QualificationInput): Promise<QualificationResult> {
  const provider = getLlmProvider();
  try {
    const result = await provider.generateJson<unknown>(QUALIFY_SYSTEM, JSON.stringify(input));
    return sanitizeQualification(result);
  } catch {
    const { HeuristicProvider } = await import("@/lib/ai/heuristic");
    const fallback = await new HeuristicProvider().generateJson<unknown>(
      QUALIFY_SYSTEM,
      JSON.stringify(input),
    );
    return sanitizeQualification(fallback);
  }
}

export async function suggestMessage(input: MessageSuggestionInput): Promise<string> {
  const provider = getLlmProvider();
  const system = `You write concise WhatsApp messages for luxury real-estate advisors.
Keep it under 320 characters, professional, no emojis, no hype. This is a suggestion task.`;
  try {
    return sanitizeSuggestedMessage(await provider.generateText(system, JSON.stringify(input)));
  } catch {
    const { HeuristicProvider } = await import("@/lib/ai/heuristic");
    return sanitizeSuggestedMessage(
      await new HeuristicProvider().generateText(system, JSON.stringify(input)),
    );
  }
}
