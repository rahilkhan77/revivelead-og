import { PaddlePaymentProvider, isPaddleEnabled } from "@/lib/billing/paddle";
import type { PaymentProvider } from "@/lib/providers/types";

export function getPaymentProvider(): PaymentProvider {
  return new PaddlePaymentProvider();
}

export function isBillingProviderEnabled() {
  return isPaddleEnabled();
}
