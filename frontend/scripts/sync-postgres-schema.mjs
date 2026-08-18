import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve("prisma/schema.prisma");
const target = resolve("prisma/postgres/schema.prisma");
mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
const schema = readFileSync(target, "utf8").replace('provider = "sqlite"', 'provider = "postgresql"');
writeFileSync(target, schema);
console.log("Wrote prisma/postgres/schema.prisma");
