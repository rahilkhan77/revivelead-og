import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const schemaPath = resolve("prisma/schema.prisma");
const url = process.env.DATABASE_URL ?? "";
if (!url.startsWith("postgres")) process.exit(0);

const schema = readFileSync(schemaPath, "utf8");
if (!schema.includes('provider = "sqlite"')) process.exit(0);

writeFileSync(schemaPath, schema.replace('provider = "sqlite"', 'provider = "postgresql"'));
console.log("Prisma provider switched to postgresql for this build.");
