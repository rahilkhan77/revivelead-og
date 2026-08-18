import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/api-auth";
import { DEFAULT_ORG_SETTINGS, type OrgSettings } from "@/lib/constants";
import { db } from "@/lib/db";
import { markDormantLeads, processDueFollowUps } from "@/lib/follow-up/engine";
import { parseJson } from "@/lib/format";
import { tooManyRequests } from "@/lib/http";
import { logSecurity } from "@/lib/log";
import { clientKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const limited = await rateLimit(clientKey(request, "cron"), "cron");
  if (!limited.ok) return tooManyRequests(retryAfterSeconds(limited));
  if (!requireCronSecret(request)) {
    logSecurity("auth.failure", { action: "cron" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processDueFollowUps();
  const orgs = await db.organization.findMany({ select: { id: true, settings: true } });
  for (const org of orgs) {
    const settings = parseJson<OrgSettings>(org.settings, DEFAULT_ORG_SETTINGS);
    await markDormantLeads(org.id, settings.followUp?.dormantDays ?? 30);
  }

  return NextResponse.json({ ok: true, ...result });
}
