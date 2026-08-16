import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { isClerkEnabled } from "@/lib/auth/clerk";
import { resolveClerkToAppUser, resolveExistingClerkUser, type AppUser } from "@/lib/auth/provision-clerk";
import { canViewAllLeads, isAdmin, isManager } from "@/lib/roles";

export { canViewAllLeads, isAdmin, isManager };
export type { AppUser };

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 401,
  ) {
    super(message);
  }
}

export async function getSessionUser(): Promise<AppUser | null> {
  if (isClerkEnabled()) {
    try {
      const { auth, currentUser } = await import("@clerk/nextjs/server");
      const { userId } = await auth();
      if (userId) {
        const existing = await resolveExistingClerkUser(userId);
        if (existing) return existing;
        const clerkUser = await currentUser();
        if (clerkUser) {
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          return resolveClerkToAppUser({
            clerkId: clerkUser.id,
            email,
            name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username,
            image: clerkUser.imageUrl,
          });
        }
      }
    } catch {
      // Fall through to Auth.js so local demo and tests keep working.
    }
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
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect(isClerkEnabled() ? "/sign-in" : "/login");
  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}

export function assertRole(role: Role, allowed: Role[]) {
  if (!allowed.includes(role)) {
    throw new AuthError("You do not have permission to do that.", 403);
  }
}
