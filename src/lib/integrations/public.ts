import type { Integration } from "@prisma/client";
import { parseJson } from "@/lib/format";
import { maskSecret, parseWhatsAppConfig, whatsappStatus } from "@/lib/whatsapp/config";

export type PublicIntegration = {
  id: string;
  type: Integration["type"];
  name: string;
  enabled: boolean;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  config: {
    phoneNumberId: string;
    businessAccountId: string;
    fromNumber: string;
    accessTokenSet: boolean;
    accessTokenHint: string;
    webhookSecretSet: boolean;
    webhookSecretHint: string;
    smtpHost: string;
    smtpUser: string;
    fromEmail: string;
    url: string;
    secretSet: boolean;
    secretHint: string;
  };
};

export function toPublicIntegration(integration: Integration): PublicIntegration {
  const config = parseJson<Record<string, string>>(integration.config, {});
  const whatsapp = parseWhatsAppConfig(integration.config);
  const status =
    integration.type === "WHATSAPP"
      ? whatsappStatus(integration.enabled, whatsapp)
      : integration.enabled
        ? "CONNECTED"
        : "DISCONNECTED";

  return {
    id: integration.id,
    type: integration.type,
    name: integration.name,
    enabled: integration.enabled,
    status,
    config: {
      phoneNumberId: whatsapp.phoneNumberId ?? "",
      businessAccountId: whatsapp.businessAccountId ?? "",
      fromNumber: whatsapp.fromNumber ?? "",
      accessTokenSet: Boolean(whatsapp.accessToken),
      accessTokenHint: maskSecret(whatsapp.accessToken),
      webhookSecretSet: Boolean(whatsapp.secret || whatsapp.webhookSecret),
      webhookSecretHint: maskSecret(whatsapp.secret || whatsapp.webhookSecret),
      smtpHost: config.smtpHost ?? "",
      smtpUser: config.smtpUser ?? "",
      fromEmail: config.fromEmail ?? "",
      url: config.url ?? "",
      secretSet: Boolean(config.secret),
      secretHint: maskSecret(config.secret),
    },
  };
}
