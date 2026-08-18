export interface AuthProvider {
  readonly name: string;
  enabled(): boolean;
}

export interface LeadSourceProvider {
  readonly name: string;
  readonly kind: "csv" | "excel" | "api" | "crm" | "sheets";
}

export interface EmailTransactionalProvider {
  readonly name: string;
  send(input: { to: string; subject: string; html: string; text?: string }): Promise<{
    ok: boolean;
    providerId?: string;
    demo?: boolean;
    error?: string;
  }>;
}

export type PaymentCheckoutInput = {
  organizationId: string;
  organizationName: string;
  email?: string | null;
  plan: "STARTER" | "PRO" | "ENTERPRISE";
  successUrl: string;
  cancelUrl: string;
};

export type PaymentCheckoutResult = {
  url?: string;
  transactionId?: string;
  clientToken?: string;
  environment?: "sandbox" | "production";
  subscriptionId?: string;
  keyId?: string;
  name?: string;
  description?: string;
  prefillName?: string;
  prefillEmail?: string;
  planUpdated?: boolean;
};

export interface PaymentProvider {
  readonly name: string;
  enabled(): boolean;
  createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult>;
  createPortalSession(input: { customerId: string; subscriptionId?: string | null }): Promise<{ url: string }>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  resumeSubscription?(subscriptionId: string): Promise<unknown>;
}

export interface PropertyProvider {
  readonly name: string;
}

export const FUTURE_LEAD_SOURCES = [
  "hubspot",
  "salesforce",
  "zoho",
  "pipedrive",
  "google_sheets",
  "property_portal",
] as const;

export const FUTURE_CALENDAR_PROVIDERS = ["google_calendar"] as const;
