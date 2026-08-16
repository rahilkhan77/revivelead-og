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
