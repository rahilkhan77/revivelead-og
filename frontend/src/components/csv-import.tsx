"use client";

import { useState } from "react";
import { importCsvAction, previewCsvAction } from "@/actions/import";
import { Button } from "@/components/ui/button";
import type { CsvPreviewRow } from "@/lib/leads/csv";
import { toast } from "sonner";

export function CsvImport() {
  const [rows, setRows] = useState<CsvPreviewRow[]>([]);
  const [summary, setSummary] = useState<{ imported: number; skipped?: number; updated?: number; duplicates?: number; failed: number; errors: string[] } | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-4">
      <form
        className="space-y-3 rounded-lg border border-border p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const file = (event.currentTarget.elements.namedItem("file") as HTMLInputElement)?.files?.[0];
          if (!file) {
            toast.error("Choose a CSV file.");
            return;
          }
          const text = await file.text();
          const form = new FormData();
          form.set("csv", text);
          const result = await previewCsvAction(form);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          setRows(result.data?.rows ?? []);
          setSummary(null);
        }}
      >
        <input name="file" type="file" accept=".csv,text/csv" className="text-sm" />
        <p className="text-xs text-muted-foreground">
          Columns: name, phone, email, source, propertyType, location, budget, currency, buyOrRent, timeline, notes
        </p>
        <Button type="submit">Preview</Button>
      </form>

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-3 py-2">Line</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.line}-${row.name}`} className="border-b border-border/70">
                  <td className="px-3 py-2">{row.line}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">{row.phone ?? "—"}</td>
                  <td className="px-3 py-2">{row.valid ? "Ready" : row.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3">
            <Button
              disabled={pending}
              onClick={async () => {
                setPending(true);
                const result = await importCsvAction(rows);
                setPending(false);
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                setSummary(result.data ?? null);
                toast.success("Import finished");
              }}
            >
              {pending ? "Importing..." : "Confirm import"}
            </Button>
          </div>
        </div>
      ) : null}

      {summary ? (
        <div className="rounded-lg border border-border p-4 text-sm">
          <p>Imported: {summary.imported}</p>
          <p>Skipped (duplicates): {summary.skipped ?? summary.duplicates ?? 0}</p>
          <p>Failed: {summary.failed}</p>
          {summary.errors.length > 0 ? (
            <ul className="mt-2 list-disc pl-5 text-muted-foreground">
              {summary.errors.slice(0, 8).map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
