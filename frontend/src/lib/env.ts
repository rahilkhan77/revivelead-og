const PRODUCTION_REQUIRED = ["DATABASE_URL", "AUTH_SECRET", "AUTH_URL", "CRON_SECRET"] as const;

export function missingProductionEnv() {
  if (process.env.NODE_ENV !== "production") return [];
  return PRODUCTION_REQUIRED.filter((key) => !process.env[key]?.trim());
}

export function assertProductionEnv() {
  const missing = missingProductionEnv();
  if (missing.length === 0) return;
  throw new Error(
    `ReviveLead cannot start in production. Missing required environment variables: ${missing.join(", ")}. See docs/PRODUCTION.md.`,
  );
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
