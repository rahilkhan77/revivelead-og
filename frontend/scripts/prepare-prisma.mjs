import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function readEnvFile(path) {
  if (!existsSync(path)) return {};
  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

const fileEnv = {
  ...readEnvFile(resolve(".env")),
  ...readEnvFile(resolve(".env.local")),
};
const url = process.env.DATABASE_URL || fileEnv.DATABASE_URL || "";
const usePostgres = Boolean(process.env.VERCEL) || url.startsWith("postgres");
const schema = usePostgres ? "prisma/postgres/schema.prisma" : "prisma/schema.prisma";

const result = spawnSync("npx", ["prisma", "generate", "--schema", schema], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

if (result.status) process.exit(result.status);
console.log(`Prisma client generated from ${schema}`);
