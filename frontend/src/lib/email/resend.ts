import { isProduction } from "@/lib/env";
import type { EmailTransactionalProvider } from "@/lib/providers/types";

export class ResendEmailProvider implements EmailTransactionalProvider {
  readonly name = "resend";

  async send(input: { to: string; subject: string; html: string; text?: string }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
      if (isProduction()) {
        return { ok: false, error: "Resend is not configured." };
      }
      return { ok: true, providerId: `demo_email_${Date.now()}`, demo: true };
    }

    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    return { ok: true, providerId: result.data?.id };
  }
}

export function getEmailProvider() {
  return new ResendEmailProvider();
}
