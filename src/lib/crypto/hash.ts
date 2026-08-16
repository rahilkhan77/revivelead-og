import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function randomToken(bytes = 24) {
  return randomBytes(bytes).toString("hex");
}

export function publicWidgetKey() {
  return `wl_${randomBytes(18).toString("hex")}`;
}

export function apiKeyPair() {
  const secret = `rl_${randomBytes(24).toString("hex")}`;
  return {
    secret,
    prefix: secret.slice(0, 10),
    hash: sha256(secret),
  };
}
