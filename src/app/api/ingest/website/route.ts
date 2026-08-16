import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveOrgFromSecret } from "@/lib/api-auth";
import { payloadTooLarge } from "@/lib/http";
import { ingestLead } from "@/lib/leads/service";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().max(40).optional(),
  email: z.string().email().max(160).optional(),
  propertyType: z.string().max(80).optional(),
  location: z.string().max(120).optional(),
  budgetMin: z.number().int().nonnegative().optional(),
  budgetMax: z.number().int().nonnegative().optional(),
  notes: z.string().max(4000).optional(),
});

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "website-ingest"), 40).ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (payloadTooLarge(request)) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const organizationId = await resolveOrgFromSecret(
    request.headers.get("x-api-key") ?? request.headers.get("x-revivelead-secret"),
    ["WEBHOOK", "N8N"],
  );
  if (!organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const lead = await ingestLead({
    organizationId,
    ...parsed.data,
    source: "Website",
  });
  return NextResponse.json({ ok: true, leadId: lead.id, deduped: Boolean(lead.deduped) }, { status: 201 });
}
