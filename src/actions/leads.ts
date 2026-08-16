"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { qualifyLead, suggestMessage } from "@/lib/ai/qualify";
import { assertMemberInOrganization } from "@/lib/org";
import { canViewAllLeads } from "@/lib/roles";
import { LEAD_STATUSES } from "@/lib/constants";
import { db } from "@/lib/db";
import { normalizeEmail, normalizePhone } from "@/lib/leads/normalize";
import { ingestLead, leadVisibilityWhere, receiveLeadReply, updateLeadStatus } from "@/lib/leads/service";
import { getMessagingProvider } from "@/lib/messaging/provider";
import { fail, ok, toErrorMessage, withUser, type ActionResult } from "@/lib/safe-action";
import type { IntentType, LeadStatus, LeadTemperature } from "@prisma/client";

const leadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  source: z.string().optional(),
  propertyType: z.string().optional(),
  location: z.string().optional(),
  budgetMin: z.coerce.number().optional(),
  budgetMax: z.coerce.number().optional(),
  intent: z.enum(["BUYING", "RENTING", "UNKNOWN"]).optional(),
  timeline: z.string().optional(),
  bedrooms: z.coerce.number().optional(),
  notes: z.string().optional(),
  assignedAgentId: z.string().optional(),
});

export async function createLeadAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await withUser();
    const parsed = leadSchema.parse({
      name: formData.get("name"),
      phone: formData.get("phone") || undefined,
      email: formData.get("email") || undefined,
      source: formData.get("source") || undefined,
      propertyType: formData.get("propertyType") || undefined,
      location: formData.get("location") || undefined,
      budgetMin: formData.get("budgetMin") || undefined,
      budgetMax: formData.get("budgetMax") || undefined,
      intent: formData.get("intent") || "UNKNOWN",
      timeline: formData.get("timeline") || undefined,
      bedrooms: formData.get("bedrooms") || undefined,
      notes: formData.get("notes") || undefined,
      assignedAgentId: formData.get("assignedAgentId") || undefined,
    });

    if (parsed.assignedAgentId) {
      await assertMemberInOrganization(user.organizationId, parsed.assignedAgentId);
    }
    const lead = await ingestLead({
      organizationId: user.organizationId,
      actorId: user.id,
      ...parsed,
      intent: parsed.intent as IntentType,
    });
    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return ok({ id: lead.id });
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function updateLeadAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await withUser();
    const id = String(formData.get("id") ?? "");
    const existing = await db.lead.findFirst({
      where: { id, ...leadVisibilityWhere(user.organizationId, user.id, canViewAllLeads(user.role)) },
    });
    if (!existing) return fail("Lead not found.");

    if (formData.get("assignedAgentId")) {
      await assertMemberInOrganization(user.organizationId, String(formData.get("assignedAgentId")));
    }
    const parsed = leadSchema.partial().parse({
      name: formData.get("name") || undefined,
      phone: formData.get("phone") || undefined,
      email: formData.get("email") || undefined,
      source: formData.get("source") || undefined,
      propertyType: formData.get("propertyType") || undefined,
      location: formData.get("location") || undefined,
      budgetMin: formData.get("budgetMin") || undefined,
      budgetMax: formData.get("budgetMax") || undefined,
      intent: formData.get("intent") || undefined,
      timeline: formData.get("timeline") || undefined,
      bedrooms: formData.get("bedrooms") || undefined,
      notes: formData.get("notes") || undefined,
      assignedAgentId: formData.get("assignedAgentId") || undefined,
    });

    await db.lead.update({
      where: { id },
      data: {
        ...parsed,
        intent: parsed.intent as IntentType | undefined,
        phoneNormalized: parsed.phone ? normalizePhone(parsed.phone) : undefined,
        emailNormalized: parsed.email ? normalizeEmail(parsed.email) : undefined,
      },
    });
    revalidatePath(`/leads/${id}`);
    revalidatePath("/leads");
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function changeLeadStatusAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await withUser();
    const status = String(formData.get("status") ?? "") as LeadStatus;
    if (!LEAD_STATUSES.includes(status)) return fail("Invalid status.");
    const leadId = String(formData.get("leadId") ?? "");
    const visible = await db.lead.findFirst({
      where: { id: leadId, ...leadVisibilityWhere(user.organizationId, user.id, canViewAllLeads(user.role)) },
    });
    if (!visible) return fail("Lead not found.");
    await updateLeadStatus({
      organizationId: user.organizationId,
      leadId,
      status,
      actorId: user.id,
    });
    revalidatePath("/leads");
    revalidatePath("/dashboard");
    revalidatePath("/revenue");
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function assignLeadAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await withUser();
    if (!canViewAllLeads(user.role)) return fail("Only managers can assign leads.");
    const leadId = String(formData.get("leadId") ?? "");
    const assignedAgentId = String(formData.get("assignedAgentId") ?? "") || null;
    const lead = await db.lead.findFirst({
      where: { id: leadId, organizationId: user.organizationId },
    });
    if (!lead) return fail("Lead not found.");
    if (assignedAgentId) {
      await assertMemberInOrganization(user.organizationId, assignedAgentId);
    }
    await db.lead.update({
      where: { id: leadId },
      data: { assignedAgentId },
    });
    await writeAudit({
      organizationId: user.organizationId,
      userId: user.id,
      action: "lead.assigned",
      entity: "Lead",
      entityId: leadId,
      metadata: { assignedAgentId },
    });
    revalidatePath("/leads");
    revalidatePath("/team");
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function qualifyLeadAction(leadId: string): Promise<ActionResult> {
  try {
    const user = await withUser();
    const lead = await db.lead.findFirst({
      where: { id: leadId, ...leadVisibilityWhere(user.organizationId, user.id, canViewAllLeads(user.role)) },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!lead) return fail("Lead not found.");

    const result = await qualifyLead({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      propertyType: lead.propertyType,
      location: lead.location,
      budgetMin: lead.budgetMin,
      budgetMax: lead.budgetMax,
      intent: lead.intent,
      timeline: lead.timeline,
      bedrooms: lead.bedrooms,
      currency: lead.currency,
      notes: lead.notes,
      conversation: lead.messages.map((m) => `${m.direction}: ${m.body}`).join("\n"),
    });

    await db.lead.update({
      where: { id: lead.id },
      data: {
        leadScore: result.leadScore,
        temperature: result.temperature as LeadTemperature,
        recommendedAction: result.recommendedAction,
        objections: result.objections,
        intent: result.intent,
        qualificationJson: JSON.stringify(result),
        estimatedValue: result.budgetMax ?? lead.estimatedValue,
      },
    });
    revalidatePath(`/leads/${leadId}`);
    return ok(result);
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function sendLeadMessageAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await withUser();
    const leadId = String(formData.get("leadId") ?? "");
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return fail("Message cannot be empty.");

    const lead = await db.lead.findFirst({
      where: { id: leadId, ...leadVisibilityWhere(user.organizationId, user.id, canViewAllLeads(user.role)) },
    });
    if (!lead) return fail("Lead not found.");

    const channel = lead.phone ? "WHATSAPP" : "EMAIL";
    const result = await getMessagingProvider(channel).send({
      to: lead.phone || lead.email || "",
      body,
      leadId,
      organizationId: user.organizationId,
    });
    if (!result.ok) return fail(result.error ?? "Message failed to send.");

    await db.leadMessage.create({
      data: {
        organizationId: user.organizationId,
        leadId,
        direction: "OUTBOUND",
        channel,
        body,
        sentByUserId: user.id,
        providerId: result.providerId,
      },
    });

    await db.lead.update({
      where: { id: leadId },
      data: {
        lastContactedAt: new Date(),
        status: lead.status === "NEW" ? "CONTACTED" : lead.status,
      },
    });

    revalidatePath(`/leads/${leadId}`);
    return ok({ demo: result.demo });
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function simulateInboundAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await withUser();
    const leadId = String(formData.get("leadId") ?? "");
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return fail("Message cannot be empty.");

    const lead = await db.lead.findFirst({
      where: { id: leadId, ...leadVisibilityWhere(user.organizationId, user.id, canViewAllLeads(user.role)) },
    });
    if (!lead) return fail("Lead not found.");

    await receiveLeadReply({
      organizationId: user.organizationId,
      leadId,
      body,
    });
    revalidatePath(`/leads/${leadId}`);
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function suggestReplyAction(leadId: string): Promise<ActionResult<{ message: string }>> {
  try {
    const user = await withUser();
    const lead = await db.lead.findFirst({
      where: { id: leadId, ...leadVisibilityWhere(user.organizationId, user.id, canViewAllLeads(user.role)) },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 8 } },
    });
    if (!lead) return fail("Lead not found.");
    const message = await suggestMessage({
      leadName: lead.name,
      location: lead.location,
      propertyType: lead.propertyType,
      intent: lead.intent,
      lastMessages: lead.messages.map((m) => `${m.direction}: ${m.body}`).reverse(),
      goal: "reply",
    });
    return ok({ message });
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}
