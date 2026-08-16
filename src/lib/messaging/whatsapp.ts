import { isProduction } from "@/lib/env";
import { db } from "@/lib/db";
import { assertWithinWhatsAppLimit, incrementWhatsAppUsage } from "@/lib/billing/plans";
import type { MessagingProvider, OutboundMessage, SendResult } from "@/lib/messaging/types";
import {
  parseWhatsAppConfig,
  sanitizeProviderError,
} from "@/lib/whatsapp/config";

const TIMEOUT_MS = 12_000;

export class WhatsAppProvider implements MessagingProvider {
  readonly channel = "WHATSAPP" as const;

  async send(message: OutboundMessage): Promise<SendResult> {
    const integration = await db.integration.findFirst({
      where: {
        organizationId: message.organizationId,
        type: "WHATSAPP",
      },
    });
    const config = parseWhatsAppConfig(integration?.config);

    if (!integration?.enabled || !config.accessToken || !config.phoneNumberId) {
      if (isProduction() && integration?.enabled) {
        return {
          ok: false,
          provider: "whatsapp",
          error: "WhatsApp is enabled but Phone Number ID or Access Token is missing.",
        };
      }
      return {
        ok: true,
        provider: "whatsapp-demo",
        providerId: `demo_${Date.now()}`,
        demo: true,
      };
    }

    try {
      await assertWithinWhatsAppLimit(message.organizationId);
    } catch (error) {
      return {
        ok: false,
        provider: "whatsapp",
        error: error instanceof Error ? error.message : "WhatsApp limit reached.",
      };
    }

    const to = message.to.replace(/\D/g, "");
    if (!to) {
      return { ok: false, provider: "whatsapp", error: "A destination phone number is required." };
    }

    const payload = message.templateName
      ? {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: message.templateName,
            language: { code: message.templateLanguage ?? "en" },
          },
        }
      : {
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message.body },
        };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const raw = await response.text();
        console.error("WhatsApp outbound failed", {
          organizationId: message.organizationId,
          status: response.status,
        });
        return {
          ok: false,
          provider: "whatsapp",
          error: sanitizeProviderError(raw || `WhatsApp API error ${response.status}`),
        };
      }

      const data = (await response.json()) as { messages?: { id?: string }[] };
      await incrementWhatsAppUsage(message.organizationId);
      return {
        ok: true,
        provider: "whatsapp",
        providerId: data.messages?.[0]?.id,
      };
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "AbortError";
      console.error("WhatsApp outbound failed", {
        organizationId: message.organizationId,
        timedOut,
      });
      return {
        ok: false,
        provider: "whatsapp",
        error: timedOut ? "WhatsApp request timed out." : "WhatsApp request failed.",
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
