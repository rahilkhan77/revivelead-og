const PRODUCTION_CLERK_FRONTEND_API = "https://clerk.frontend-2-gray.vercel.app";
const CLERK_PROTECT = "https://*.protect.clerk.com";
const CLERK_PROTECT_CONNECT = "https://*.protect.clerk.com:*";

function sourceList(...parts: Array<string | string[] | null | undefined>) {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const part of parts) {
    const items = Array.isArray(part) ? part : part ? [part] : [];
    for (const item of items) {
      if (!item || seen.has(item)) continue;
      seen.add(item);
      values.push(item);
    }
  }
  return values.join(" ");
}

function asHttpsOrigin(value: string) {
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
}

function toWebSocketOrigin(origin: string) {
  return origin.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
}

export function clerkFrontendApiOriginFromPublishableKey(key?: string | null) {
  const trimmed = key?.trim();
  if (!trimmed) return null;
  const encoded = trimmed.replace(/^pk_(test|live)_/i, "");
  if (!encoded || encoded === trimmed) return null;
  try {
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    const decoded = Buffer.from(padded, "base64")
      .toString("utf8")
      .replace(/[\u0000$]+$/g, "")
      .trim();
    if (!/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(decoded)) return null;
    return `https://${decoded}`;
  } catch {
    return null;
  }
}

export function clerkFrontendApiOrigin(explicit?: string | null) {
  if (explicit?.trim()) return asHttpsOrigin(explicit.trim());
  for (const raw of [process.env.NEXT_PUBLIC_CLERK_FRONTEND_API, process.env.CLERK_FRONTEND_API]) {
    if (!raw?.trim()) continue;
    const origin = asHttpsOrigin(raw.trim());
    if (origin) return origin;
  }
  return clerkFrontendApiOriginFromPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

function clerkFrontendApiOrigins(explicit?: string | null) {
  return [...new Set([clerkFrontendApiOrigin(explicit), PRODUCTION_CLERK_FRONTEND_API].filter(Boolean))] as string[];
}

export function contentSecurityPolicy(options?: { clerkFrontendApi?: string | null }) {
  const fapiOrigins =
    options && "clerkFrontendApi" in options
      ? options.clerkFrontendApi
        ? clerkFrontendApiOrigins(options.clerkFrontendApi)
        : [PRODUCTION_CLERK_FRONTEND_API]
      : clerkFrontendApiOrigins();
  const fapiSockets = fapiOrigins.map(toWebSocketOrigin);

  const clerkScript = [
    ...fapiOrigins,
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
    "https://js.clerk.dev",
    "https://*.lcl.dev",
    "https://*.shared.lcl.dev",
    "https://*.lclclerk.com",
    CLERK_PROTECT,
    "https://challenges.cloudflare.com",
  ];
  const clerkConnect = [
    ...fapiOrigins,
    ...fapiSockets,
    "https://*.clerk.accounts.dev",
    "wss://*.clerk.accounts.dev",
    "https://*.clerk.com",
    "https://api.clerk.com",
    "https://js.clerk.dev",
    "https://clerk-telemetry.com",
    "https://*.clerk-telemetry.com",
    "https://img.clerk.com",
    "https://*.lcl.dev",
    "wss://*.lcl.dev",
    "https://*.shared.lcl.dev",
    "wss://*.shared.lcl.dev",
    "https://*.lclclerk.com",
    "wss://*.lclclerk.com",
    CLERK_PROTECT,
    CLERK_PROTECT_CONNECT,
    "https://challenges.cloudflare.com",
  ];
  const clerkFrames = [
    "'self'",
    ...fapiOrigins,
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
    "https://*.lcl.dev",
    "https://*.shared.lcl.dev",
    "https://*.lclclerk.com",
    CLERK_PROTECT,
    "https://challenges.cloudflare.com",
    "https://accounts.google.com",
  ];
  const clerkImages = [
    ...fapiOrigins,
    "https://img.clerk.com",
    "https://*.clerk.com",
    CLERK_PROTECT,
    "https://challenges.cloudflare.com",
    "https://*.googleusercontent.com",
  ];
  const clerkForms = [
    "'self'",
    ...fapiOrigins,
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
    "https://*.lcl.dev",
    "https://*.shared.lcl.dev",
    "https://*.lclclerk.com",
    "https://accounts.google.com",
    "https://*.google.com",
    "https://accounts.google.co.in",
    "https://*.google.co.in",
  ];

  return [
    "default-src 'self'",
    "base-uri 'self'",
    `form-action ${sourceList(clerkForms)}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src ${sourceList("'self'", "'unsafe-inline'", "'unsafe-eval'", "https://checkout.razorpay.com", "https://*.razorpay.com", clerkScript)}`,
    "style-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
    `img-src ${sourceList("'self'", "data:", "blob:", "https://images.unsplash.com", "https://*.razorpay.com", clerkImages)}`,
    `font-src ${sourceList("'self'", "data:", CLERK_PROTECT, "https://challenges.cloudflare.com")}`,
    `connect-src ${sourceList("'self'", "https://api.razorpay.com", "https://*.razorpay.com", "https://accounts.google.com", clerkConnect)}`,
    `frame-src ${sourceList("https://checkout.razorpay.com", "https://api.razorpay.com", "https://*.razorpay.com", clerkFrames)}`,
    "worker-src 'self' blob:",
  ].join("; ");
}

export function applicationSecurityHeaders() {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy() },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  ];
}

export function appOriginSet() {
  const origins = new Set<string>();
  for (const raw of [process.env.NEXT_PUBLIC_APP_URL, process.env.AUTH_URL, process.env.NEXTAUTH_URL]) {
    if (!raw?.trim()) continue;
    try {
      origins.add(new URL(raw).origin);
    } catch {
      /* ignore malformed */
    }
  }
  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }
  return origins;
}
