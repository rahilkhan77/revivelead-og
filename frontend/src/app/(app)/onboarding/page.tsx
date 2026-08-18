import { OnboardingWizard } from "@/components/onboarding-wizard";
import { PageHeader } from "@/components/page-header";
import { getOrganizationRecord, requireUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { getOrgSettings } from "@/lib/follow-up/engine";
import { toPublicIntegration } from "@/lib/integrations/public";

export default async function OnboardingPage() {
  const user = await requireUser();
  const [organization, integrations] = await Promise.all([
    getOrganizationRecord(user.organizationId),
    db.integration.findMany({ where: { organizationId: user.organizationId } }),
  ]);
  if (!organization) throw new Error("Organization not found.");
  const whatsapp = integrations.find((item) => item.type === "WHATSAPP");

  return (
    <div>
      <PageHeader
        title="Set up your agency"
        description="Configure market, currency, WhatsApp and follow-ups before the first live lead arrives."
      />
      <OnboardingWizard
        organization={organization}
        settings={getOrgSettings(organization.settings)}
        whatsapp={whatsapp ? toPublicIntegration(whatsapp) : null}
      />
    </div>
  );
}
