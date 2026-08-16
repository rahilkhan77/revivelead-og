import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveOrgFromRequest } from "@/lib/api-auth";
import { canViewAllLeads, getSessionUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { payloadTooLarge } from "@/lib/http";
import { ingestLead, leadVisibilityWhere } from "@/lib/leads/service";
import { clientKey, rateLimit } from "@/lib/rate-limit";

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

function limited(request: Request, scope: string) {
  const result = rateLimit(clientKey(request, scope), 60);
  if (result.ok) return null;
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}

export async function GET(request: Request) {
  const blocked = limited(request, "leads-get");
  if (blocked) return blocked;

  const organizationId = await resolveOrgFromRequest(request);
  if (!organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await getSessionUser();
  const canSeeAll = session?.organizationId === organizationId
    ? canViewAllLeads(session.role)
    : true;

  const leads = await db.lead.findMany({
    where: leadVisibilityWhere(
      organizationId,
      session?.id ?? "",
      canSeeAll,
    ),
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      source: true,
      propertyType: true,
      location: true,
      status: true,
      leadScore: true,
      temperature: true,
      assignedAgentId: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const blocked = limited(request, "leads-post");
  if (blocked) return blocked;
  if (payloadTooLarge(request)) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const organizationId = await resolveOrgFromRequest(request);
  if (!organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const lead = await ingestLead({ organizationId, ...parsed.data });
  return NextResponse.json({ lead }, { status: 201 });
}
