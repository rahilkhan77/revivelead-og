import { PageHeader } from "@/components/page-header";
import { LeadForm } from "@/components/lead-form";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";

export default async function NewLeadPage() {
  const user = await requireUser();
  const agents = await db.membership.findMany({
    where: { organizationId: user.organizationId },
    include: { user: true },
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Add lead" description="The lead is stored, qualified, assigned and entered into the follow-up sequence." />
      <LeadForm
        agents={agents.map((item) => ({ id: item.userId, name: item.user.name }))}
      />
    </div>
  );
}
