export type OutboundMessage = {
  to: string;
  body: string;
  leadId: string;
  organizationId: string;
  templateName?: string;
  templateLanguage?: string;
};

export type SendResult = {
  ok: boolean;
  provider: string;
  providerId?: string;
  demo?: boolean;
  error?: string;
};

export interface MessagingProvider {
  readonly channel: "WHATSAPP" | "EMAIL";
  send(message: OutboundMessage): Promise<SendResult>;
}
