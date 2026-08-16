import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { DEFAULT_ORG_SETTINGS } from "@/lib/constants";

export async function createAgency(slug: string) {
  const passwordHash = await hash("Test1234!", 10);
  const owner = await db.user.create({
    data: {
      name: `${slug} owner`,
      email: `${slug}-owner@example.com`,
      passwordHash,
    },
  });
  const agent = await db.user.create({
    data: {
      name: `${slug} agent`,
      email: `${slug}-agent@example.com`,
      passwordHash,
    },
  });
  const organization = await db.organization.create({
    data: {
      name: `${slug} Realty`,
      slug,
      market: "Dubai",
      country: "UAE",
      timezone: "Asia/Dubai",
      currency: "AED",
      onboardingCompleted: true,
      settings: JSON.stringify(DEFAULT_ORG_SETTINGS),
    },
  });
  await db.membership.createMany({
    data: [
      { userId: owner.id, organizationId: organization.id, role: "OWNER" },
      { userId: agent.id, organizationId: organization.id, role: "SALES_AGENT" },
    ],
  });
  await db.subscription.create({
    data: {
      organizationId: organization.id,
      plan: "PRO",
      status: "ACTIVE",
      seats: 15,
      leadLimit: 2000,
      automationLimit: 25,
      whatsappMonthlyLimit: 2000,
    },
  });

  return {
    organization,
    owner,
    agent,
    async cleanup() {
      await db.revenueEvent.deleteMany({ where: { organizationId: organization.id } });
      await db.campaignRecipient.deleteMany({
        where: { campaign: { organizationId: organization.id } },
      });
      await db.campaign.deleteMany({ where: { organizationId: organization.id } });
      await db.automationExecution.deleteMany({
        where: { automation: { organizationId: organization.id } },
      });
      await db.automation.deleteMany({ where: { organizationId: organization.id } });
      await db.followUp.deleteMany({ where: { organizationId: organization.id } });
      await db.leadMessage.deleteMany({ where: { organizationId: organization.id } });
      await db.notification.deleteMany({ where: { organizationId: organization.id } });
      await db.chatMessage.deleteMany({ where: { session: { organizationId: organization.id } } });
      await db.chatSession.deleteMany({ where: { organizationId: organization.id } });
      await db.importHistory.deleteMany({ where: { organizationId: organization.id } });
      await db.apiKey.deleteMany({ where: { organizationId: organization.id } });
      await db.property.deleteMany({ where: { organizationId: organization.id } });
      await db.lead.deleteMany({ where: { organizationId: organization.id } });
      await db.subscription.deleteMany({ where: { organizationId: organization.id } });
      await db.integration.deleteMany({ where: { organizationId: organization.id } });
      await db.invitation.deleteMany({ where: { organizationId: organization.id } });
      await db.auditLog.deleteMany({ where: { organizationId: organization.id } });
      await db.membership.deleteMany({ where: { organizationId: organization.id } });
      await db.organization.delete({ where: { id: organization.id } });
      await db.user.deleteMany({ where: { id: { in: [owner.id, agent.id] } } });
    },
  };
}
