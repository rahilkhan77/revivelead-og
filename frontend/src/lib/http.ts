import { NextResponse } from "next/server";

const DEFAULT_LIMIT = 100_000;

export function payloadTooLarge(request: Request, limit = DEFAULT_LIMIT) {
  const length = Number(request.headers.get("content-length") ?? 0);
  return Number.isFinite(length) && length > limit;
}

export function oversizedResponse() {
  return { error: "Payload too large" };
}

export function safeCallbackPath(value: string | null | undefined) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/dashboard";
  }
  return value;
}

export function publicWidgetCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export function sanitizeSearchQuery(value: string) {
  return value.trim().slice(0, 80);
}

export function tooManyRequests(retryAfter = 60) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfter)) } },
  );
}
