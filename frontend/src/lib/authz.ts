import { AuthError } from "@/lib/errors";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { isClerkEnabled } from "@/lib/auth/clerk";
import { resolveClerkToAppUser, resolveExistingClerkUser, type AppUser } from "@/lib/auth/provision-clerk";
import { db } from "@/lib/db";
import { logSecurity } from "@/lib/log";
import { canViewAllLeads, isAdmin, isManager } from "@/lib/roles";

export { AuthError };
export { canViewAllLeads, isAdmin, isManager };
export type { AppUser };

function clerkEmail(user: {
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: Array<{ emailAddress?: string | null }>;
}) {
  return (
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses?.find((item) => item.emailAddress)?.emailAddress ??
    null
  );
}

export const getSessionUser = cache(async function getSessionUser(): Promise<AppUser | null> {
  if (isClerkEnabled()) {
    const { auth: clerkAuth, currentUser } = await import("@clerk/nextjs/server");
    const { userId } = await clerkAuth();
    if (userId) {
      const existing = await resolveExistingClerkUser(userId);
      if (existing) return existing;

      const clerkUser = await currentUser();
      if (!clerkUser) {
        throw new Error("Your Clerk session is missing user details. Sign in again.");
      }

      const provisioned = await resolveClerkToAppUser({
        clerkId: clerkUser.id,
        email: clerkEmail(clerkUser),
        name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username,
        image: clerkUser.imageUrl,
      });
      if (!provisioned) {
        throw new Error(
          "Could not create your ReviveLead workspace. The signed-in account needs an email address.",
        );
      }
      return provisioned;
    }
    return null;
  }

  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    organizationId: session.user.organizationId,
    organizationName: session.user.organizationName,
    role: session.user.role,
  };
});

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect(isClerkEnabled() ? "/sign-in" : "/login");
  return user;
}

export const getOrganizationRecord = cache(async function getOrganizationRecord(organizationId: string) {
  return db.organization.findUnique({ where: { id: organizationId } });
});

export const getOrganizationFlags = cache(async function getOrganizationFlags(organizationId: string) {
  const org = await getOrganizationRecord(organizationId);
  return org ? { onboardingCompleted: org.onboardingCompleted, isDemo: org.isDemo } : null;
});

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

export function assertRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) {
    logSecurity("authz.denied", { reason: "role_required" });
    throw new AuthError("You do not have permission to do that.", 403);
  }
}
