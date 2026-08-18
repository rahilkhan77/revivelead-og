import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveOrgFromRequest } from "@/lib/api-auth";
import { payloadTooLarge, tooManyRequests } from "@/lib/http";
import { ingestLead } from "@/lib/leads/service";
import { clientKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().max(40).optional(),
  email: z.string().email().max(160).optional(),
  source: z.string().max(80).optional(),
  propertyType: z.string().max(80).optional(),
  location: z.string().max(120).optional(),
  budgetMin: z.number().int().nonnegative().optional(),
  budgetMax: z.number().int().nonnegative().optional(),
  intent: z.enum(["BUYING", "RENTING", "UNKNOWN"]).optional(),
  timeline: z.string().max(80).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  notes: z.string().max(4000).optional(),
});

export async function POST(request: Request) {
  const limited = await rateLimit(clientKey(request, "ingest-leads"), "ingest");
  if (!limited.ok) {
    return tooManyRequests(retryAfterSeconds(limited));
  }
  if (payloadTooLarge(request)) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  const organizationId = await resolveOrgFromRequest(request);
  if (!organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const lead = await ingestLead({ organizationId, ...parsed.data, source: parsed.data.source ?? "API" });
  return NextResponse.json({ ok: true, leadId: lead.id, deduped: Boolean(lead.deduped) }, { status: 201 });
}
