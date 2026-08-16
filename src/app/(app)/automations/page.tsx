import { PageHeader } from "@/components/page-header";
import { AutomationBuilder } from "@/components/automation-builder";
import { requireRole } from "@/lib/authz";
import { MANAGER_ROLES } from "@/lib/constants";
import { db } from "@/lib/db";

export default async function AutomationsPage() {
  const user = await requireRole(MANAGER_ROLES);
  const automations = await db.automation.findMany({
    where: { organizationId: user.organizationId },
    include: { executions: { orderBy: { createdAt: "desc" }, take: 3 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Automations"
        description="Triggers and actions run in-product. Enabled webhook/n8n integrations receive the same events."
      />
      <AutomationBuilder automations={automations} />
    </div>
  );
}
