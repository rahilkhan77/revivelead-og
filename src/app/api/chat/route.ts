import { NextResponse } from "next/server";
import { z } from "zod";
import { handleChatTurn } from "@/lib/chat/engine";
import { db } from "@/lib/db";
import { payloadTooLarge } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  sessionId: z.string().max(80).optional(),
  widgetKey: z.string().min(8).max(80),
  message: z.string().min(1).max(1000),
});

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "chat"), 30).ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (payloadTooLarge(request, 20_000)) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const org = await db.organization.findFirst({
    where: { widgetKey: parsed.data.widgetKey },
    select: { id: true },
  });
  if (!org) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await handleChatTurn({
      organizationId: org.id,
      sessionId: parsed.data.sessionId,
      message: parsed.data.message,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({
      sessionId: parsed.data.sessionId,
      reply: "I can still help you look for homes. What area and budget should I start with?",
      properties: [],
      handoff: false,
      leadCaptured: false,
    });
  }
}
