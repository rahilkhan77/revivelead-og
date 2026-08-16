import { CsvImport } from "@/components/csv-import";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/authz";

export default async function LeadImportPage() {
  await requireUser();
  return (
    <div>
      <PageHeader
        title="Import leads"
        description="Upload a CSV, preview validation errors, then confirm. Duplicate phone or email inside this agency is skipped."
      />
      <CsvImport />
    </div>
  );
}
