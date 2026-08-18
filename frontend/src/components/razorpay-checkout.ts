"use client";

type RazorpayCheckoutResponse = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open: () => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Checkout must run in the browser."));
  }
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Unable to load Razorpay Checkout."));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export async function openRazorpayCheckout(input: {
  keyId: string;
  subscriptionId: string;
  name?: string;
  description?: string;
  prefillName?: string;
  prefillEmail?: string;
}) {
  await loadRazorpayScript();
  const RazorpayCheckout = window.Razorpay;
  if (!RazorpayCheckout) throw new Error("Razorpay Checkout failed to initialize.");

  return new Promise<RazorpayCheckoutResponse>((resolve, reject) => {
    const checkout = new RazorpayCheckout({
      key: input.keyId,
      subscription_id: input.subscriptionId,
      name: input.name ?? "ReviveLead",
      description: input.description ?? "Subscription",
      prefill: {
        name: input.prefillName,
        email: input.prefillEmail,
      },
      theme: { color: "#3a4d73" },
      handler: (response: RazorpayCheckoutResponse) => {
        if (!response?.razorpay_payment_id || !response.razorpay_subscription_id || !response.razorpay_signature) {
          reject(new Error("Checkout did not return a verifiable payment."));
          return;
        }
        resolve(response);
      },
      modal: {
        ondismiss: () => reject(new Error("CHECKOUT_DISMISSED")),
      },
    });
    checkout.open();
  });
}
