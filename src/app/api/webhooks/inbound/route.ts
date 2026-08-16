import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveOrgFromSecret } from "@/lib/api-auth";
import { payloadTooLarge } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  handleInboundWhatsApp,
  parseMetaWhatsAppPayload,
  resolveOrgFromPhoneNumberId,
  verifyMetaSignature,
} from "@/lib/whatsapp/inbound";
import { db } from "@/lib/db";
import { parseWhatsAppConfig, webhookSecretOf } from "@/lib/whatsapp/config";

const customSchema = z.object({
  phone: z.string().min(4).max(40).optional(),
  from: z.string().min(4).max(40).optional(),
  body: z.string().min(1).max(4000).optional(),
  text: z.string().min(1).max(4000).optional(),
  organizationId: z.string().optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && challenge) {
    const organizationId = await resolveOrgFromSecret(token, ["WHATSAPP"]);
    if (!organizationId) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, "inbound"), 120).ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (payloadTooLarge(request)) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const raw = await request.text();
  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const headerSecret =
    request.headers.get("x-revivelead-secret") ??
    request.headers.get("x-api-key");
  const signature = request.headers.get("x-hub-signature-256");

  const metaMessages = parseMetaWhatsAppPayload(payload);
  if (metaMessages.length > 0) {
    const results = [];
    for (const message of metaMessages) {
      const organizationId =
        (await resolveOrgFromPhoneNumberId(message.phoneNumberId)) ??
        (await resolveOrgFromSecret(headerSecret, ["WHATSAPP", "WEBHOOK", "N8N"]));
      if (!organizationId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (signature) {
        const integration = await db.integration.findFirst({
          where: { organizationId, type: "WHATSAPP" },
        });
        const secret = webhookSecretOf(parseWhatsAppConfig(integration?.config));
        if (!secret || !verifyMetaSignature(raw, signature, secret)) {
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      }

      results.push(
        await handleInboundWhatsApp({
          organizationId,
          phone: message.phone,
          body: message.body,
          providerId: message.providerId,
          contactName: message.contactName,
        }),
      );
    }
    return NextResponse.json({ ok: true, results });
  }

  const organizationId = await resolveOrgFromSecret(headerSecret, ["WHATSAPP", "WEBHOOK", "N8N"]);
  if (!organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = customSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const phone = parsed.data.phone ?? parsed.data.from ?? "";
  const body = parsed.data.body ?? parsed.data.text ?? "";
  const result = await handleInboundWhatsApp({
    organizationId,
    phone,
    body,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Unable to store inbound message" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, leadId: result.leadId, created: result.created });
}
