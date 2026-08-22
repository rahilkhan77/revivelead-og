import { describe, expect, it } from "vitest";
import { prismaDatasourceUrl } from "@/lib/db";

describe("prismaDatasourceUrl", () => {
  it("leaves sqlite URLs unchanged", () => {
    expect(prismaDatasourceUrl("file:./dev.db")).toBe("file:./dev.db");
  });

  it("uses a small Prisma pool for concurrent queries without exhausting a tiny session pooler", () => {
    const url = prismaDatasourceUrl("postgres://user:pass@db.example.com:5432/app");
    const parsed = new URL(url);
    expect(parsed.searchParams.get("connection_limit")).toBe("5");
    expect(parsed.searchParams.get("pool_timeout")).toBe("20");
    expect(parsed.searchParams.get("pgbouncer")).toBeNull();
    expect(parsed.port).toBe("5432");
  });

  it("moves Supabase session pooler URLs to transaction mode", () => {
    const url = prismaDatasourceUrl(
      "postgres://user:pass@aws-0-ap-south-1.pooler.supabase.com:5432/postgres",
    );
    const parsed = new URL(url);
    expect(parsed.port).toBe("6543");
    expect(parsed.searchParams.get("pgbouncer")).toBe("true");
    expect(parsed.searchParams.get("sslmode")).toBe("require");
    expect(parsed.searchParams.get("connection_limit")).toBe("5");
  });

  it("marks Supabase transaction pooler URLs for Prisma pgbouncer mode", () => {
    const url = prismaDatasourceUrl(
      "postgres://user:pass@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
    );
    const parsed = new URL(url);
    expect(parsed.port).toBe("6543");
    expect(parsed.searchParams.get("pgbouncer")).toBe("true");
    expect(parsed.searchParams.get("sslmode")).toBe("require");
    expect(parsed.searchParams.get("connection_limit")).toBe("5");
  });
});
