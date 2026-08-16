import { DeveloperSettings } from "@/components/developer-settings";
import { PageHeader } from "@/components/page-header";
import { SettingsForms } from "@/components/settings-forms";
import { requireUser } from "@/lib/authz";
import { getOrgSettings } from "@/lib/follow-up/engine";
import { toPublicIntegration } from "@/lib/integrations/public";
import { db } from "@/lib/db";

export default async function SettingsPage() {
  const user = await requireUser();
  const [organization, integrations, subscription, apiKeys] = await Promise.all([
    db.organization.findUniqueOrThrow({ where: { id: user.organizationId } }),
    db.integration.findMany({ where: { organizationId: user.organizationId } }),
    db.subscription.findUnique({ where: { organizationId: user.organizationId } }),
    db.apiKey.findMany({ where: { organizationId: user.organizationId }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Organization, AI, messaging, webhooks and notification preferences."
      />
      <SettingsForms
        organization={organization}
        settings={getOrgSettings(organization.settings)}
        integrations={integrations.map(toPublicIntegration)}
        plan={subscription?.plan ?? "STARTER"}
        role={user.role}
      />
      <DeveloperSettings
        widgetKey={organization.widgetKey}
        keys={apiKeys.map((item) => ({
          id: item.id,
          name: item.name,
          prefix: item.prefix,
          revokedAt: item.revokedAt,
        }))}
      />
    </div>
  );
}
