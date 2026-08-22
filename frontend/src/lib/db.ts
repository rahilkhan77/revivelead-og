import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function prismaDatasourceUrl(
  raw = process.env.DATABASE_URL ?? "",
  options?: { connectionLimit?: string; poolTimeout?: string },
) {
  if (!raw.startsWith("postgres")) return raw;

  try {
    const parsed = new URL(raw);
    const port = parsed.port || "5432";
    const supabasePooler = /pooler\.supabase\.com$/i.test(parsed.hostname);
    // Supabase :5432 on the pooler host is PgBouncer session mode (pool_size ~15).
    // Prisma connection_limit>1 on Vercel Fluid exhausts it (EMAXCONNSESSION).
    // Transaction mode (:6543) multiplexes serverless clients instead.
    if (supabasePooler && port === "5432") {
      parsed.port = "6543";
    }
    const pooledHost = supabasePooler || /pooler|pgbouncer/i.test(parsed.hostname) || parsed.port === "6543";

    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set(
        "connection_limit",
        options?.connectionLimit ?? process.env.PRISMA_CONNECTION_LIMIT ?? "5",
      );
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", options?.poolTimeout ?? process.env.PRISMA_POOL_TIMEOUT ?? "20");
    }
    if (pooledHost && !parsed.searchParams.has("pgbouncer")) {
      parsed.searchParams.set("pgbouncer", "true");
    }
    if (!parsed.searchParams.has("sslmode") && /supabase|neon|prisma|rds\.amazonaws|pooler/i.test(parsed.hostname)) {
      parsed.searchParams.set("sslmode", "require");
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}

function createPrismaClient() {
  const url = prismaDatasourceUrl();
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(url ? { datasourceUrl: url } : {}),
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = db;
