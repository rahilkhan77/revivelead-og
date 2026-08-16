import { EmailProvider } from "@/lib/messaging/email";
import { WhatsAppProvider } from "@/lib/messaging/whatsapp";
import type { MessagingProvider } from "@/lib/messaging/types";

export function getMessagingProvider(channel: "WHATSAPP" | "EMAIL"): MessagingProvider {
  if (channel === "EMAIL") return new EmailProvider();
  return new WhatsAppProvider();
}
