"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_ROLES } from "@/lib/constants";
import { db } from "@/lib/db";
import { autoMapColumns, type ColumnMapping } from "@/lib/import/mapping";
import { detectAndPreview, parseSpreadsheet, previewMappedRows, type ImportRow } from "@/lib/import/parse";
import { findDuplicateLead, ingestLead } from "@/lib/leads/service";
import { fail, ok, toErrorMessage, withUser } from "@/lib/safe-action";
import type { CsvPreviewRow } from "@/lib/leads/csv";

export async function previewCsvAction(formData: FormData) {
  try {
    await withUser();
    const text = String(formData.get("csv") ?? "");
    if (!text.trim()) return fail("Upload a CSV file first.");
    const preview = detectAndPreview(text);
    return ok({ rows: preview.rows as CsvPreviewRow[] });
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function importCsvAction(rows: CsvPreviewRow[]) {
  return confirmImportAction({
    filename: "upload.csv",
    mapping: {},
    rows: rows.map((row) => ({ ...row, valid: row.valid })),
    mode: "skip",
  });
}

export async function previewImportAction(formData: FormData) {
  try {
    const user = await withUser();
    if (!ADMIN_ROLES.includes(user.role)) return fail("Admin access required.");
    const file = formData.get("file");
    if (!(file instanceof File)) return fail("Upload a CSV or Excel file.");
    if (file.size > 2_000_000) return fail("File is too large. Keep it under 2MB.");
    const buffer = Buffer.from(await file.arrayBuffer());
    const table = await parseSpreadsheet(buffer, file.name);
    const mapping = autoMapColumns(table.headers);
    const rows = previewMappedRows(table.headers, table.rows, mapping);
    return ok({
      filename: file.name,
      headers: table.headers,
      mapping,
      rows,
      rawRows: table.rows,
    });
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function confirmImportAction(input: {
  filename: string;
  mapping: ColumnMapping;
  rows: ImportRow[];
  mode: "skip" | "update" | "create";
}) {
  try {
    const user = await withUser();
    if (!ADMIN_ROLES.includes(user.role)) return fail("Admin access required.");
    const summary = { imported: 0, updated: 0, duplicates: 0, failed: 0, errors: [] as string[] };

    for (const row of input.rows) {
      if (!row.valid) {
        summary.failed += 1;
        summary.errors.push(`Line ${row.line}: ${row.error ?? "Invalid row"}`);
        continue;
      }
      try {
        const existing = await findDuplicateLead(user.organizationId, row.phone, row.email);
        if (existing && input.mode === "skip") {
          summary.duplicates += 1;
          continue;
        }
        if (existing && input.mode === "update") {
          await db.lead.update({
            where: { id: existing.id },
            data: {
              notes: [existing.notes, row.notes].filter(Boolean).join("\n") || existing.notes,
              location: row.location ?? existing.location,
              propertyType: row.propertyType ?? existing.propertyType,
              budgetMax: row.budget ?? existing.budgetMax,
            },
          });
          summary.updated += 1;
          continue;
        }
        const lead = await ingestLead({
          organizationId: user.organizationId,
          actorId: user.id,
          name: row.name,
          phone: row.phone,
          email: row.email,
          source: row.source ?? "Portal import",
          propertyType: row.propertyType,
          location: row.location,
          budgetMax: row.budget,
          currency: row.currency,
          intent: row.buyOrRent,
          timeline: row.timeline,
          bedrooms: row.bedrooms,
          notes: row.notes,
        });
        if (lead.deduped) summary.duplicates += 1;
        else summary.imported += 1;
      } catch (error) {
        summary.failed += 1;
        summary.errors.push(`Line ${row.line}: ${toErrorMessage(error)}`);
      }
    }

    await db.importHistory.create({
      data: {
        organizationId: user.organizationId,
        filename: input.filename,
        source: "csv",
        totalRows: input.rows.length,
        imported: summary.imported,
        updated: summary.updated,
        duplicates: summary.duplicates,
        failed: summary.failed,
        mappingJson: JSON.stringify(input.mapping),
        createdById: user.id,
      },
    });

    revalidatePath("/import");
    revalidatePath("/intelligence");
    revalidatePath("/leads");
    return ok(summary);
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}
