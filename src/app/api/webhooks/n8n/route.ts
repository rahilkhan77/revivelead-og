import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveOrgFromSecret } from "@/lib/api-auth";
import { payloadTooLarge } from "@/lib/http";
import { ingestLead } from "@/lib/leads/service";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  event: z.string().optional(),
  name: z.string().min(2).max(120).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().max(160).optional(),
  source: z.string().max(80).optional(),
  propertyType: z.string().max(80).optional(),
  location: z.string().max(120).optional(),
  budgetMin: z.number().int().nonnegative().optional(),
  budgetMax: z.number().int().nonnegative().optional(),
  notes: z.string().max(4000).optional(),
});

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "n8n"), 60).ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (payloadTooLarge(request)) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const organizationId = await resolveOrgFromSecret(
    request.headers.get("x-revivelead-secret"),
    ["N8N", "WEBHOOK"],
  );
  if (!organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (parsed.data.event === "lead.created" || parsed.data.name) {
    const lead = await ingestLead({
      organizationId,
      name: parsed.data.name ?? "Unknown lead",
      phone: parsed.data.phone,
      email: parsed.data.email,
      source: parsed.data.source ?? "n8n",
      propertyType: parsed.data.propertyType,
      location: parsed.data.location,
      budgetMin: parsed.data.budgetMin,
      budgetMax: parsed.data.budgetMax,
      notes: parsed.data.notes,
    });
    return NextResponse.json({ ok: true, leadId: lead.id });
  }

  return NextResponse.json({ ok: true, ignored: true });
}
