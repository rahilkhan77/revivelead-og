"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { writeAudit } from "@/lib/audit";
import { ADMIN_ROLES } from "@/lib/constants";
import { assertWithinSeatLimit } from "@/lib/billing/plans";
import { db } from "@/lib/db";
import { ensureManager, fail, ok, toErrorMessage, withUser } from "@/lib/safe-action";

export async function inviteMemberAction(formData: FormData) {
  try {
    const user = await withUser();
    ensureManager(user.role);
    await assertWithinSeatLimit(user.organizationId);

    const email = String(formData.get("email") ?? "").toLowerCase().trim();
    const role = String(formData.get("role") ?? "SALES_AGENT") as Role;
    if (!email) return fail("Email is required.");

    const token = randomBytes(24).toString("hex");
    await db.invitation.create({
      data: {
        organizationId: user.organizationId,
        email,
        role,
        token,
        invitedById: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const inviteUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}/invite/${token}`;
    const { getEmailProvider } = await import("@/lib/email/resend");
    const emailed = await getEmailProvider().send({
      to: email,
      subject: "You are invited to ReviveLead",
      html: `<p>You have been invited to join an agency on ReviveLead.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`,
      text: `Accept your ReviveLead invitation: ${inviteUrl}`,
    });
    if (emailed.demo && process.env.NODE_ENV !== "production") {
      console.info("[invite]", inviteUrl);
    }
    await writeAudit({
      organizationId: user.organizationId,
      userId: user.id,
      action: "team.invited",
      entity: "Invitation",
      metadata: { email, role },
    });
    revalidatePath("/team");
    revalidatePath("/settings");
    return ok({ inviteUrl });
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function updateMemberRoleAction(formData: FormData) {
  try {
    const user = await withUser();
    if (!ADMIN_ROLES.includes(user.role)) return fail("Only owners and admins can change roles.");
    const membershipId = String(formData.get("membershipId") ?? "");
    const role = String(formData.get("role") ?? "") as Role;
    const membership = await db.membership.findFirst({
      where: { id: membershipId, organizationId: user.organizationId },
    });
    if (!membership) return fail("Member not found.");
    if (membership.role === "OWNER" && role !== "OWNER") {
      const owners = await db.membership.count({
        where: { organizationId: user.organizationId, role: "OWNER" },
      });
      if (owners <= 1) return fail("An organization must keep at least one owner.");
    }
    await db.membership.update({ where: { id: membershipId }, data: { role } });
    revalidatePath("/team");
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}
