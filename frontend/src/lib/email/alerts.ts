import { getEmailProvider } from "@/lib/email/resend";
import { isProduction } from "@/lib/env";
import { db } from "@/lib/db";

export async function sendWelcomeEmail(input: { to: string; name: string; organizationName: string }) {
  const app = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000";
  await getEmailProvider().send({
    to: input.to,
    subject: "Welcome to ReviveLead",
    html: `<p>Hi ${input.name},</p><p>Your agency <strong>${input.organizationName}</strong> is ready. Complete onboarding, import leads, and connect WhatsApp.</p><p><a href="${app}/onboarding">Open onboarding</a></p>`,
    text: `Welcome to ReviveLead. Open onboarding: ${app}/onboarding`,
  });
}

export async function notifyOrganizationOwners(
  organizationId: string,
  input: { subject: string; html: string; text: string },
) {
  const owners = await db.membership.findMany({
    where: { organizationId, role: "OWNER" },
    include: { user: true },
  });
  const email = getEmailProvider();
  for (const owner of owners) {
    if (!owner.user.email) continue;
    const result = await email.send({
      to: owner.user.email,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (!result.ok && isProduction()) {
      console.error("Owner alert email failed", { organizationId });
    }
  }
}

export async function notifyFollowUpFailure(input: {
  organizationId: string;
  leadName: string;
  leadId: string;
  error: string;
}) {
  const app = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "http://localhost:3000";
  await notifyOrganizationOwners(input.organizationId, {
    subject: "ReviveLead follow-up failed",
    html: `<p>A follow-up for <strong>${input.leadName}</strong> failed.</p><p>${input.error}</p><p><a href="${app}/leads/${input.leadId}">Open the lead</a></p>`,
    text: `Follow-up failed for ${input.leadName}: ${input.error}`,
  });
}

export async function notifyAutomationFailure(input: {
  organizationId: string;
  name: string;
  error: string;
}) {
  await notifyOrganizationOwners(input.organizationId, {
    subject: "ReviveLead automation failed",
    html: `<p>Automation <strong>${input.name}</strong> failed.</p><p>${input.error}</p>`,
    text: `Automation ${input.name} failed: ${input.error}`,
  });
}
