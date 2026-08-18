"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_ROLES, DEFAULT_ORG_SETTINGS, type OrgSettings } from "@/lib/constants";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/format";
import { COUNTRIES, defaultsForCountry, defaultsForMarket } from "@/lib/markets";
import { fail, ok, toErrorMessage, withUser } from "@/lib/safe-action";

export async function saveOnboardingAction(formData: FormData) {
  try {
    const user = await withUser();
    if (!ADMIN_ROLES.includes(user.role)) return fail("Only owners and admins can complete onboarding.");

    const country = String(formData.get("country") ?? "UAE");
    const market = String(formData.get("market") ?? defaultsForCountry(country).markets[0]);
    const countryDefaults = defaultsForCountry(country);
    const marketDefaults = defaultsForMarket(market);

    await db.organization.update({
      where: { id: user.organizationId },
      data: {
        name: String(formData.get("name") ?? "").trim() || undefined,
        country: COUNTRIES.includes(country as (typeof COUNTRIES)[number]) ? country : "UAE",
        market,
        timezone: String(formData.get("timezone") ?? countryDefaults.timezone ?? marketDefaults.timezone),
        currency: String(formData.get("currency") ?? countryDefaults.currency),
      },
    });
    revalidatePath("/onboarding");
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function saveOnboardingFollowUpsAction(formData: FormData) {
  try {
    const user = await withUser();
    if (!ADMIN_ROLES.includes(user.role)) return fail("Admin access required.");
    const org = await db.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
    const parsed = parseJson<Partial<OrgSettings>>(org.settings, {});
    const next: OrgSettings = {
      ...DEFAULT_ORG_SETTINGS,
      ...parsed,
      followUp: {
        ...DEFAULT_ORG_SETTINGS.followUp,
        ...parsed.followUp,
        immediateResponseMinutes: Number(formData.get("immediateResponseMinutes") ?? 0),
        firstFollowUpHours: Number(formData.get("firstFollowUpHours") ?? 24),
        secondFollowUpHours: Number(formData.get("secondFollowUpHours") ?? 72),
        agentAlertHours: Number(formData.get("agentAlertHours") ?? 168),
        templates: {
          ...DEFAULT_ORG_SETTINGS.followUp.templates,
          ...parsed.followUp?.templates,
        },
      },
    };
    await db.organization.update({
      where: { id: user.organizationId },
      data: { settings: JSON.stringify(next) },
    });
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function completeOnboardingAction() {
  try {
    const user = await withUser();
    if (!ADMIN_ROLES.includes(user.role)) return fail("Admin access required.");
    await db.organization.update({
      where: { id: user.organizationId },
      data: { onboardingCompleted: true },
    });
    revalidatePath("/dashboard");
    return ok({ redirectTo: "/dashboard" });
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}
