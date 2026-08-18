import { z } from "zod";
import type { IntentType } from "@prisma/client";
import { applyMapping, autoMapColumns, type ColumnMapping } from "@/lib/import/mapping";
import { normalizeEmail, normalizePhone } from "@/lib/leads/normalize";

export type ImportRow = {
  line: number;
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
  bedrooms?: number;
  valid: boolean;
  error?: string;
  duplicateHint?: "phone" | "email";
};

const rowSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  source: z.string().trim().max(80).optional(),
  propertyType: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
  budget: z.coerce.number().nonnegative().optional(),
  currency: z.string().trim().max(8).optional(),
  buyOrRent: z.string().trim().optional(),
  timeline: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(4000).optional(),
  bedrooms: z.coerce.number().int().min(0).max(20).optional(),
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
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else current += char;
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

export function parseDelimitedTable(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const headers = splitCsvLine(lines[0] ?? "");
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? "";
    });
    return record;
  });
  return { headers, rows };
}

export function previewMappedRows(
  headers: string[],
  rawRows: Record<string, string>[],
  mapping: ColumnMapping,
): ImportRow[] {
  return rawRows.map((raw, offset) => {
    const mapped = applyMapping(raw, mapping);
    const parsed = rowSchema.safeParse(mapped);
    if (!parsed.success) {
      return {
        line: offset + 2,
        name: mapped.name || `Row ${offset + 2}`,
        valid: false,
        error: parsed.error.issues[0]?.message ?? "Invalid row",
      };
    }
    const phone = parsed.data.phone || undefined;
    const email = parsed.data.email || undefined;
    if (phone && !normalizePhone(phone)) {
      return { line: offset + 2, name: parsed.data.name, valid: false, error: "Invalid phone" };
    }
    if (email && !normalizeEmail(email)) {
      return { line: offset + 2, name: parsed.data.name, valid: false, error: "Invalid email" };
    }
    return {
      line: offset + 2,
      ...parsed.data,
      email: email || undefined,
      buyOrRent: intentFrom(parsed.data.buyOrRent),
      valid: true,
    };
  });
}

export function detectAndPreview(text: string) {
  const table = parseDelimitedTable(text);
  const mapping = autoMapColumns(table.headers);
  return {
    headers: table.headers,
    mapping,
    rows: previewMappedRows(table.headers, table.rows, mapping),
  };
}

export function validateImportRow(row: ImportRow): ImportRow {
  return previewMappedRows(
    ["name", "phone", "email", "source", "propertyType", "location", "budget", "currency", "buyOrRent", "timeline", "notes", "bedrooms"],
    [
      {
        name: row.name ?? "",
        phone: row.phone ?? "",
        email: row.email ?? "",
        source: row.source ?? "",
        propertyType: row.propertyType ?? "",
        location: row.location ?? "",
        budget: row.budget == null ? "" : String(row.budget),
        currency: row.currency ?? "",
        buyOrRent: row.buyOrRent ?? "",
        timeline: row.timeline ?? "",
        notes: row.notes ?? "",
        bedrooms: row.bedrooms == null ? "" : String(row.bedrooms),
      },
    ],
    {
      name: "name",
      phone: "phone",
      email: "email",
      source: "source",
      propertyType: "propertyType",
      location: "location",
      budget: "budget",
      currency: "currency",
      buyOrRent: "buyOrRent",
      timeline: "timeline",
      notes: "notes",
      bedrooms: "bedrooms",
    },
  ).map((item) => ({ ...item, line: row.line || item.line }))[0] ?? {
    line: row.line || 0,
    name: "Invalid row",
    valid: false,
    error: "Invalid row",
  };
}

export async function parseSpreadsheet(buffer: Buffer, filename: string) {
  const safeName = filename.replace(/\\/g, "/").split("/").pop()?.toLowerCase() ?? "";
  if (!safeName || safeName.includes("..")) {
    return { headers: [] as string[], rows: [] as Record<string, string>[] };
  }
  if (safeName.endsWith(".xlsx") || safeName.endsWith(".xls")) {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return { headers: [] as string[], rows: [] as Record<string, string>[] };
    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell, col) => {
      headers[col - 1] = String(cell.value ?? "").trim();
    });
    const rows: Record<string, string>[] = [];
    sheet.eachRow((row, index) => {
      if (index === 1) return;
      const record: Record<string, string> = {};
      headers.forEach((header, col) => {
        record[header] = String(row.getCell(col + 1).value ?? "").trim();
      });
      rows.push(record);
    });
    return { headers: headers.filter(Boolean), rows };
  }
  if (safeName.endsWith(".csv") || safeName.endsWith(".txt")) {
    return parseDelimitedTable(buffer.toString("utf8"));
  }
  return { headers: [] as string[], rows: [] as Record<string, string>[] };
}
