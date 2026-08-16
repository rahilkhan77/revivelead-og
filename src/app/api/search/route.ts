import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canViewAllLeads } from "@/lib/roles";
import { db } from "@/lib/db";
import { leadVisibilityWhere } from "@/lib/leads/service";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  if (!rateLimit(clientKey(request, "search"), 60).ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const session = await auth();
  if (!session?.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ leads: [] });

  const leads = await db.lead.findMany({
    where: {
      ...leadVisibilityWhere(
        session.user.organizationId,
        session.user.id,
        canViewAllLeads(session.user.role),
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
