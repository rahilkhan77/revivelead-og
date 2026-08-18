import { NextResponse } from "next/server";
import { canViewAllLeads, getSessionUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { sanitizeSearchQuery, tooManyRequests } from "@/lib/http";
import { leadVisibilityWhere } from "@/lib/leads/service";
import { clientKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const limited = await rateLimit(clientKey(request, "search"), "search");
  if (!limited.ok) return tooManyRequests(retryAfterSeconds(limited));
  const session = await getSessionUser();
  if (!session?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const q = sanitizeSearchQuery(searchParams.get("q") ?? "");
  if (q.length < 2) return NextResponse.json({ leads: [] });

  const leads = await db.lead.findMany({
    where: {
      ...leadVisibilityWhere(
        session.organizationId,
        session.id,
        canViewAllLeads(session.role),
      ),
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { location: { contains: q } },
      ],
    },
    select: { id: true, name: true, location: true, status: true },
    take: 8,
  });
  return NextResponse.json({ leads });
}
