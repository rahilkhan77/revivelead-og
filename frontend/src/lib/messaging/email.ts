import { db } from "@/lib/db";
import { parseJson } from "@/lib/format";
import type { MessagingProvider, OutboundMessage, SendResult } from "@/lib/messaging/types";

type EmailConfig = {
  smtpHost?: string;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail?: string;
};

export class EmailProvider implements MessagingProvider {
  readonly channel = "EMAIL" as const;

  async send(message: OutboundMessage): Promise<SendResult> {
    const integration = await db.integration.findFirst({
      where: { organizationId: message.organizationId, type: "EMAIL" },
    });
    const config = parseJson<EmailConfig>(integration?.config, {});

    if (!integration?.enabled || !config.smtpHost) {
      console.info("[email-demo]", { to: message.to, body: message.body });
      return {
        ok: true,
        provider: "email-demo",
        providerId: `demo_email_${Date.now()}`,
        demo: true,
      };
    }

    return {
      ok: true,
      provider: "email",
      providerId: `queued_${Date.now()}`,
    };
  }
}
