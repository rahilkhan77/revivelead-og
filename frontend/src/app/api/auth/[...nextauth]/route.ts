import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { tooManyRequests } from "@/lib/http";
import { clientKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit";

export function GET(request: NextRequest) {
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(clientKey(request, "auth"), "auth");
  if (!limited.ok) return tooManyRequests(retryAfterSeconds(limited));
  return handlers.POST(request);
}
