import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { provisionOrganization } from "@/lib/onboarding/provision";
import type { Role } from "@prisma/client";

export type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  organizationId: string;
  organizationName: string;
  role: Role;
};

function isUniqueConflict(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function findClerkUser(clerkId: string, email: string) {
  return (
    (await db.user.findUnique({ where: { clerkId } })) ??
    (await db.user.findUnique({ where: { email } }))
  );
}

export async function resolveExistingClerkUser(clerkId: string): Promise<AppUser | null> {
  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) return null;
  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });
  if (!membership) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    role: membership.role,
  };
}

export async function resolveClerkToAppUser(input: {
  clerkId: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}): Promise<AppUser | null> {
  const email = input.email?.trim().toLowerCase();
  if (!email) return null;

  let user = await findClerkUser(input.clerkId, email);
  const name = input.name || email.split("@")[0] || "Agency owner";

  if (!user) {
    try {
      user = await db.user.create({
        data: {
          clerkId: input.clerkId,
          email,
          name,
          image: input.image,
        },
      });
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      user = await findClerkUser(input.clerkId, email);
    }
  }

  if (!user) return null;

  if (user.clerkId !== input.clerkId || (input.name && user.name !== input.name) || input.image) {
    try {
      user = await db.user.update({
        where: { id: user.id },
        data: {
          clerkId: input.clerkId,
          name: input.name ?? user.name,
          image: input.image ?? user.image,
          email,
        },
      });
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      user = (await findClerkUser(input.clerkId, email)) ?? user;
    }
  }

  let membership = await db.membership.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });

  if (!membership) {
    try {
      const organization = await provisionOrganization({
        userId: user.id,
        name: `${user.name}'s Agency`,
        market: "Dubai",
        actorId: user.id,
      });
      try {
        const { sendWelcomeEmail } = await import("@/lib/email/alerts");
        await sendWelcomeEmail({
          to: email,
          name: user.name,
          organizationName: organization.name,
        });
      } catch {
        // Signup must succeed even if transactional email is down.
      }
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
    }
    membership = await db.membership.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });
  }

  if (!membership) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    role: membership.role,
  };
}
