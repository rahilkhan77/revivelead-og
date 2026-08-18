import { seedDefaultAutomations } from "@/lib/automations/engine";
import { writeAudit } from "@/lib/audit";
import { DEFAULT_ORG_SETTINGS } from "@/lib/constants";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { publicWidgetKey } from "@/lib/crypto/hash";
import { defaultsForMarket } from "@/lib/markets";

export async function provisionOrganization(input: {
  userId: string;
  name: string;
  market: string;
  actorId?: string;
}) {
  const defaults = defaultsForMarket(input.market);
  const baseSlug = slugify(input.name) || "agency";
  let slug = baseSlug;
  let i = 1;
  while (await db.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }

  const organization = await db.organization.create({
    data: {
      name: input.name,
      slug,
      market: input.market,
      country: defaults.country,
      timezone: defaults.timezone,
      currency: defaults.currency,
      isDemo: false,
      onboardingCompleted: false,
      widgetKey: publicWidgetKey(),
      settings: JSON.stringify(DEFAULT_ORG_SETTINGS),
    },
  });

  await db.membership.create({
    data: {
      userId: input.userId,
      organizationId: organization.id,
      role: "OWNER",
    },
  });

  await db.subscription.create({
    data: {
      organizationId: organization.id,
      plan: "STARTER",
      status: "TRIALING",
      seats: 3,
      leadLimit: 100,
      automationLimit: 5,
      whatsappMonthlyLimit: 200,
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await db.integration.createMany({
    data: [
      { organizationId: organization.id, type: "WHATSAPP", name: "WhatsApp Business" },
      { organizationId: organization.id, type: "EMAIL", name: "Transactional email" },
      { organizationId: organization.id, type: "WEBHOOK", name: "Outbound webhook" },
      { organizationId: organization.id, type: "N8N", name: "n8n" },
    ],
  });

  await seedDefaultAutomations(organization.id);
  await writeAudit({
    organizationId: organization.id,
    userId: input.actorId ?? input.userId,
    action: "organization.created",
    entity: "Organization",
    entityId: organization.id,
  });

  return organization;
}
