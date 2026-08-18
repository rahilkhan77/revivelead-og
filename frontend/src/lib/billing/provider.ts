import { PaddlePaymentProvider, isPaddleEnabled } from "@/lib/billing/paddle";
import { RazorpayPaymentProvider, isRazorpayEnabled } from "@/lib/billing/razorpay";
import type { PaymentProvider } from "@/lib/providers/types";

export function getPaymentProvider(): PaymentProvider {
  if (isRazorpayEnabled()) return new RazorpayPaymentProvider();
  return new PaddlePaymentProvider();
}

export function isBillingProviderEnabled() {
  return isRazorpayEnabled() || isPaddleEnabled();
}
