import { z } from "zod";

export const chatExtractSchema = z.object({
  name: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(160).optional().nullable().or(z.literal("")),
  buyOrRent: z.enum(["BUYING", "RENTING", "UNKNOWN"]).optional().nullable(),
  propertyType: z.string().trim().max(80).optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  budget: z.coerce.number().nonnegative().optional().nullable(),
  currency: z.string().trim().max(8).optional().nullable(),
  bedrooms: z.coerce.number().int().min(0).max(20).optional().nullable(),
  timeline: z.string().trim().max(80).optional().nullable(),
  wantsHuman: z.boolean().optional().default(false),
  reply: z.string().trim().min(1).max(600),
});

export type ChatExtract = z.infer<typeof chatExtractSchema>;

export function mergeExtract(current: ChatExtract, next: ChatExtract): ChatExtract {
  return {
    ...current,
    ...Object.fromEntries(
      Object.entries(next).filter(([, value]) => value != null && value !== ""),
    ),
    reply: next.reply,
    wantsHuman: Boolean(next.wantsHuman || current.wantsHuman),
  };
}

export function hasEnoughLeadInfo(extract: ChatExtract) {
  return Boolean(extract.name && (extract.phone || extract.email));
}
