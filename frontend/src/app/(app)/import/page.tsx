import { ImportCenter } from "@/components/import-center";
import { PageHeader } from "@/components/page-header";
import { requireRole } from "@/lib/authz";
import { ADMIN_ROLES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export default async function ImportPage() {
  const user = await requireRole(ADMIN_ROLES);
  const history = await db.importHistory.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <div>
      <PageHeader
        title="Import Center"
        description="Upload an existing lead database. Preview, auto-map columns, then import into the same ReviveLead pipeline."
      />
      <ImportCenter />
      <h2 className="mt-8 mb-3 text-sm font-medium">Import history</h2>
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground">No imports yet.</p>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <div key={item.id} className="flex justify-between rounded-lg border border-border px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{item.filename}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
              </div>
              <p className="text-muted-foreground">
                {item.imported} imported · {item.updated} updated · {item.duplicates} duplicates · {item.failed} failed
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
