import type { LlmProvider, QualificationInput, QualificationResult } from "@/lib/ai/types";

function scoreLead(input: QualificationInput): QualificationResult {
  const text = [
    input.notes,
    input.conversation,
    input.location,
    input.propertyType,
    input.timeline,
    input.intent,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 35;
  if (input.budgetMax && input.budgetMax >= 2000000) score += 18;
  else if (input.budgetMax && input.budgetMax >= 800000) score += 12;
  else if (input.budgetMax) score += 6;

  if (input.location) score += 8;
  if (input.propertyType) score += 6;
  if (input.bedrooms) score += 4;
  if (input.phone) score += 6;
  if (input.email) score += 3;
  if (/(this week|asap|urgent|ready|viewing)/.test(text)) score += 16;
  if (/(1-3 months|next month|soon)/.test(text)) score += 10;
  if (/(just looking|maybe later|no budget)/.test(text)) score -= 15;
  if (input.intent === "BUYING") score += 8;
  if (input.intent === "RENTING") score += 4;

  score = Math.max(5, Math.min(98, score));
  const temperature = score >= 75 ? "HOT" : score >= 50 ? "WARM" : "COLD";

  const intent =
    input.intent === "BUYING" || /buy|purchase|invest/.test(text)
      ? "BUYING"
      : input.intent === "RENTING" || /rent|lease/.test(text)
        ? "RENTING"
        : "UNKNOWN";

  const objections = /(price|far|school|parking|delay|another agent)/.test(text)
    ? "Price, timing or competing options mentioned in the conversation."
    : null;

  const recommendedAction =
    temperature === "HOT"
      ? "Call within 15 minutes and offer two viewing slots today."
      : temperature === "WARM"
        ? "Send a short WhatsApp with 2 matching listings and a viewing invite."
        : "Nurture with a market update and a low-friction question about budget or area.";

  return {
    budgetMin: input.budgetMin ?? null,
    budgetMax: input.budgetMax ?? null,
    preferredLocation: input.location ?? null,
    propertyType: input.propertyType ?? null,
    bedrooms: input.bedrooms ?? null,
    currency: input.currency ?? null,
    intent,
    timeline: input.timeline ?? null,
    objections,
    leadScore: score,
    temperature,
    recommendedAction,
    summary: `${input.name} looks ${temperature.toLowerCase()} (${score}/100) for ${input.propertyType ?? "property"} in ${input.location ?? "an unspecified area"}.`,
  };
}

export class HeuristicProvider implements LlmProvider {
  readonly name = "heuristic";

  async generateJson<T>(system: string, user: string): Promise<T> {
    if (system.includes("qualification")) {
      const input = JSON.parse(user) as QualificationInput;
      return scoreLead(input) as T;
    }
    if (system.includes("reactivation") || system.includes("suggestion")) {
      const payload = JSON.parse(user) as { leadName?: string; location?: string };
      return {
        message: `Hi ${payload.leadName ?? "there"}, this is Al Noor Properties. Inventory in ${payload.location ?? "your preferred area"} has moved — I have 2 homes that match what you asked for. Would you like a 10-minute walkthrough this week?`,
      } as T;
    }
    return JSON.parse(user) as T;
  }

  async generateText(_system: string, user: string): Promise<string> {
    try {
      const payload = JSON.parse(user) as {
        leadName?: string;
        location?: string;
        propertyType?: string;
        goal?: string;
      };
      if (payload.goal === "reactivate") {
        return `Hi ${payload.leadName ?? "there"}, it’s been a while. New ${payload.propertyType ?? "homes"} just came up in ${payload.location ?? "your area"} that fit what you were looking for. Shall I send two options?`;
      }
      return `Hi ${payload.leadName ?? "there"}, thanks for your enquiry. I can share 2–3 ${payload.propertyType ?? "properties"} in ${payload.location ?? "your preferred community"} today. When is a good time for a quick call?`;
    } catch {
      return "Thanks for your enquiry. I can share matching options today — when works for a quick call?";
    }
  }
}
