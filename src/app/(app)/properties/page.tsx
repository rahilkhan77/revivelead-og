import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default async function PropertiesPage() {
  const user = await requireUser();
  const properties = await db.property.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader
        title="Property inventory"
        description="Listings used by the website chatbot, lead intelligence and campaign personalization. Never invented."
      />
      {properties.length === 0 ? (
        <EmptyState title="No properties yet" description="Add inventory so the chatbot can recommend real homes." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border p-4">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                {item.location} · {item.bedrooms ?? "—"} bed · {formatMoney(item.price, item.currency)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{item.status}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
