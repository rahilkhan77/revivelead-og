"use client";

export async function openPaddleCheckout(input: {
  transactionId: string;
  clientToken: string;
  environment: "sandbox" | "production";
}) {
  const { initializePaddle } = await import("@paddle/paddle-js");
  const paddle = await initializePaddle({
    token: input.clientToken,
    environment: input.environment,
  });
  if (!paddle) throw new Error("Paddle.js failed to initialize.");
  paddle.Checkout.open({ transactionId: input.transactionId });
}
