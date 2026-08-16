import { z } from "zod";
import type { QualificationResult } from "@/lib/ai/types";

const nullableNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value == null || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

const nullableString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (!value) return null;
    return value.trim().slice(0, 500) || null;
  });

export const qualificationSchema = z.object({
  budgetMin: nullableNumber.optional().default(null),
  budgetMax: nullableNumber.optional().default(null),
  preferredLocation: nullableString.optional().default(null),
  propertyType: nullableString.optional().default(null),
  bedrooms: nullableNumber.optional().default(null),
  currency: nullableString.optional().default(null),
  intent: z
    .enum(["BUYING", "RENTING", "UNKNOWN"])
    .optional()
    .catch("UNKNOWN")
    .default("UNKNOWN"),
  timeline: nullableString.optional().default(null),
  objections: nullableString.optional().default(null),
  leadScore: z.coerce.number().catch(0),
  temperature: z.enum(["HOT", "WARM", "COLD"]).optional().catch(undefined),
  recommendedAction: z.string().trim().min(1).max(400).catch("Call the lead and confirm budget, area and timeline."),
  summary: z.string().trim().max(400).optional().default(""),
});

export function sanitizeQualification(raw: unknown, fallbackScore = 0): QualificationResult {
  const parsed = qualificationSchema.safeParse(raw);
  const data = parsed.success
    ? parsed.data
    : {
        budgetMin: null,
        budgetMax: null,
        preferredLocation: null,
        propertyType: null,
        bedrooms: null,
        currency: null,
        intent: "UNKNOWN" as const,
        timeline: null,
        objections: null,
        leadScore: fallbackScore,
        recommendedAction: "Call the lead and confirm budget, area and timeline.",
        summary: "",
      };

  const leadScore = Math.max(0, Math.min(100, Math.round(Number(data.leadScore) || fallbackScore)));
  const temperature =
    data.temperature === "HOT" || data.temperature === "WARM" || data.temperature === "COLD"
      ? data.temperature
      : leadScore >= 75
        ? "HOT"
        : leadScore >= 50
          ? "WARM"
          : "COLD";

  return {
    budgetMin: data.budgetMin ?? null,
    budgetMax: data.budgetMax ?? null,
    preferredLocation: data.preferredLocation ?? null,
    propertyType: data.propertyType ?? null,
    bedrooms: data.bedrooms == null ? null : Math.max(0, Math.min(20, Math.round(data.bedrooms))),
    currency: data.currency ?? null,
    intent: data.intent,
    timeline: data.timeline ?? null,
    objections: data.objections ?? null,
    leadScore,
    temperature,
    recommendedAction: data.recommendedAction.slice(0, 400),
    summary: (data.summary || "").slice(0, 400),
  };
}

export function sanitizeSuggestedMessage(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 500);
}
