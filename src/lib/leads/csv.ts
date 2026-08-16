import { z } from "zod";
import type { IntentType } from "@prisma/client";

export type CsvLeadRow = {
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  propertyType?: string;
  location?: string;
  budget?: number;
  currency?: string;
  buyOrRent?: IntentType;
  timeline?: string;
  notes?: string;
  line: number;
};

export type CsvPreviewRow = CsvLeadRow & {
  valid: boolean;
  error?: string;
};

const rowSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email("Invalid email").max(160).optional().or(z.literal("")),
  source: z.string().trim().max(80).optional(),
  propertyType: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
  budget: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().max(8).optional(),
  buyOrRent: z.string().trim().optional(),
  timeline: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(4000).optional(),
});

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function intentFrom(value?: string): IntentType | undefined {
  const normalized = (value ?? "").toLowerCase();
  if (["buy", "buying", "purchase", "invest"].includes(normalized)) return "BUYING";
  if (["rent", "renting", "lease"].includes(normalized)) return "RENTING";
  if (normalized) return "UNKNOWN";
  return undefined;
}

export function parseLeadCsv(text: string): CsvPreviewRow[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const headers = splitCsvLine(lines[0] ?? "").map((header) => header.replace(/\s+/g, "").toLowerCase());
  const index = (name: string) => headers.indexOf(name);

  return lines.slice(1).map((line, offset) => {
    const cells = splitCsvLine(line);
    const raw = {
      name: cells[index("name")] ?? "",
      phone: cells[index("phone")] || undefined,
      email: cells[index("email")] || undefined,
      source: cells[index("source")] || undefined,
      propertyType: cells[index("propertytype")] || undefined,
      location: cells[index("location")] || undefined,
      budget: cells[index("budget")] || undefined,
      currency: cells[index("currency")] || undefined,
      buyOrRent: cells[index("buyorrent")] || undefined,
      timeline: cells[index("timeline")] || undefined,
      notes: cells[index("notes")] || undefined,
    };
    const parsed = rowSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        name: raw.name || `Row ${offset + 2}`,
        line: offset + 2,
        valid: false,
        error: parsed.error.issues[0]?.message ?? "Invalid row",
      };
    }
    return {
      ...parsed.data,
      email: parsed.data.email || undefined,
      buyOrRent: intentFrom(parsed.data.buyOrRent),
      line: offset + 2,
      valid: true,
    };
  });
}
