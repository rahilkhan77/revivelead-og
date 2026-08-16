"use server";

import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { provisionOrganization } from "@/lib/onboarding/provision";
import { fail, ok, toErrorMessage, type ActionResult } from "@/lib/safe-action";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(2),
  market: z.string().min(2),
});

export async function loginAction(formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const email = String(formData.get("email") ?? "").toLowerCase();
    await signIn("credentials", {
      email,
      password: String(formData.get("password") ?? ""),
      redirect: false,
    });
    const user = await db.user.findUnique({
      where: { email },
      include: { memberships: { include: { organization: true }, take: 1 } },
    });
    const org = user?.memberships[0]?.organization;
    const redirectTo = org && !org.onboardingCompleted && !org.isDemo ? "/onboarding" : "/dashboard";
    return ok({ redirectTo });
  } catch (error) {
    if (error instanceof AuthError) return fail("Invalid email or password.");
    return fail(toErrorMessage(error));
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function signupAction(formData: FormData): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const parsed = signupSchema.parse({
      name: formData.get("name"),
      email: String(formData.get("email") ?? "").toLowerCase(),
      password: formData.get("password"),
      organizationName: formData.get("organizationName"),
      market: formData.get("market"),
    });

    const existing = await db.user.findUnique({ where: { email: parsed.email } });
    if (existing) return fail("An account with this email already exists.");

    const passwordHash = await hash(parsed.password, 12);
    const user = await db.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        passwordHash,
      },
    });

    await provisionOrganization({
      userId: user.id,
      name: parsed.organizationName,
      market: parsed.market,
      actorId: user.id,
    });

    await signIn("credentials", {
      email: parsed.email,
      password: parsed.password,
      redirect: false,
    });

    return ok({ redirectTo: "/onboarding" });
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function requestPasswordResetAction(formData: FormData): Promise<ActionResult<{ resetUrl?: string }>> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (!email) return fail("Email is required.");

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return ok();

  const token = randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const resetUrl = `${process.env.AUTH_URL ?? "http://localhost:3000"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  const { getEmailProvider } = await import("@/lib/email/resend");
  const emailed = await getEmailProvider().send({
    to: email,
    subject: "Reset your ReviveLead password",
    html: `<p><a href="${resetUrl}">Reset password</a></p>`,
    text: `Reset your password: ${resetUrl}`,
  });
  if (emailed.demo && process.env.NODE_ENV !== "production") {
    console.info("[password-reset]", resetUrl);
  }
  return ok({ resetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl });
}

export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return fail("Password must be at least 8 characters.");

  const record = await db.verificationToken.findFirst({
    where: { identifier: email, token, expires: { gt: new Date() } },
  });
  if (!record) return fail("This reset link is invalid or has expired.");

  await db.user.update({
    where: { email },
    data: { passwordHash: await hash(password, 12) },
  });
  await db.verificationToken.deleteMany({ where: { identifier: email, token } });
  return ok();
}

export async function acceptInviteAction(formData: FormData): Promise<ActionResult> {
  try {
    const token = String(formData.get("token") ?? "");
    const name = String(formData.get("name") ?? "");
    const password = String(formData.get("password") ?? "");
    const invite = await db.invitation.findUnique({ where: { token } });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
      return fail("This invitation is invalid or expired.");
    }
    if (name.length < 2 || password.length < 8) {
      return fail("Name and a password of at least 8 characters are required.");
    }

    let user = await db.user.findUnique({ where: { email: invite.email } });
    if (!user) {
      user = await db.user.create({
        data: {
          name,
          email: invite.email,
          passwordHash: await hash(password, 12),
        },
      });
    }

    await db.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: invite.organizationId,
        },
      },
      update: { role: invite.role },
      create: {
        userId: user.id,
        organizationId: invite.organizationId,
        role: invite.role,
      },
    });

    await db.invitation.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    await signIn("credentials", {
      email: invite.email,
      password,
      redirect: false,
    });
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}
