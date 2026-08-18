"use server";

import { revalidatePath } from "next/cache";
import { canViewAllLeads } from "@/lib/roles";
import { db } from "@/lib/db";
import { executeFollowUp, markDormantLeads, processDueFollowUps } from "@/lib/follow-up/engine";
import { leadVisibilityWhere } from "@/lib/leads/service";
import { ensureManager, fail, ok, toErrorMessage, withUser } from "@/lib/safe-action";

export async function completeFollowUpAction(formData: FormData) {
  try {
    const user = await withUser();
    const id = String(formData.get("id") ?? "");
    const followUp = await db.followUp.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!followUp) return fail("Follow-up not found.");
    await db.followUp.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    revalidatePath("/follow-ups");
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function runFollowUpEngineAction() {
  try {
    const user = await withUser();
    ensureManager(user.role);
    const result = await processDueFollowUps(user.organizationId);
    const org = await db.organization.findUnique({ where: { id: user.organizationId } });
    const settings = org ? JSON.parse(org.settings || "{}") : {};
    await markDormantLeads(user.organizationId, settings.followUp?.dormantDays ?? 30);
    revalidatePath("/follow-ups");
    revalidatePath("/dashboard");
    revalidatePath("/leads");
    return ok(result);
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function sendFollowUpNowAction(formData: FormData) {
  try {
    const user = await withUser();
    const id = String(formData.get("id") ?? "");
    const followUp = await db.followUp.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!followUp) return fail("Follow-up not found.");
    if (followUp.status === "FAILED") {
      await db.followUp.update({ where: { id }, data: { status: "PENDING" } });
    }
    await executeFollowUp(id, user.organizationId);
    revalidatePath("/follow-ups");
    revalidatePath("/leads");
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function createManualFollowUpAction(formData: FormData) {
  try {
    const user = await withUser();
    const leadId = String(formData.get("leadId") ?? "");
    const message = String(formData.get("message") ?? "").slice(0, 4000);
    const dueRaw = String(formData.get("dueAt") ?? "");
    const dueAt = dueRaw ? new Date(dueRaw) : new Date();
    if (Number.isNaN(dueAt.getTime())) return fail("Invalid due date.");
    const lead = await db.lead.findFirst({
      where: { id: leadId, ...leadVisibilityWhere(user.organizationId, user.id, canViewAllLeads(user.role)) },
    });
    if (!lead) return fail("Lead not found.");
    await db.followUp.create({
      data: {
        organizationId: user.organizationId,
        leadId,
        type: "DUE_REMINDER",
        dueAt,
        assignedToId: lead.assignedAgentId,
        message: message || "Manual follow-up",
      },
    });
    await db.lead.update({
      where: { id: leadId },
      data: { nextFollowUpAt: dueAt },
    });
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/follow-ups");
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}
