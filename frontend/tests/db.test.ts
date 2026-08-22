import { describe, expect, it } from "vitest";
import { prismaDatasourceUrl } from "@/lib/db";

describe("prismaDatasourceUrl", () => {
  it("leaves sqlite URLs unchanged", () => {
    expect(prismaDatasourceUrl("file:./dev.db")).toBe("file:./dev.db");
  });

  it("raises the pool above 1 so concurrent dashboard queries can run", () => {
    const url = prismaDatasourceUrl("postgres://user:pass@db.example.com:5432/app");
    const parsed = new URL(url);
    expect(parsed.searchParams.get("connection_limit")).toBe("10");
    expect(parsed.searchParams.get("pool_timeout")).toBe("20");
    expect(parsed.searchParams.get("pgbouncer")).toBeNull();
  });

  it("marks Supabase transaction pooler URLs for Prisma pgbouncer mode", () => {
    const url = prismaDatasourceUrl(
      "postgres://user:pass@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get("pgbouncer")).toBe("true");
    expect(parsed.searchParams.get("sslmode")).toBe("require");
    expect(parsed.searchParams.get("connection_limit")).toBe("10");
  });
});
