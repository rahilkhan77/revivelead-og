import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await db.user.findUnique({
          where: { email },
          include: {
            memberships: {
              include: { organization: true },
              take: 1,
            },
          },
        });

        if (!user?.passwordHash) return null;
        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        const membership = user.memberships[0];
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          organizationId: membership?.organizationId ?? "",
          organizationName: membership?.organization.name ?? "",
          role: membership?.role ?? "SALES_AGENT",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as {
          id: string;
          organizationId?: string;
          organizationName?: string;
          role?: string;
        };
        token.id = u.id;
        token.organizationId = u.organizationId;
        token.organizationName = u.organizationName;
        token.role = u.role as typeof token.role;
      }

      if (trigger === "update" && token.id) {
        const membership = await db.membership.findFirst({
          where: { userId: token.id },
          include: { organization: true },
        });
        if (membership) {
          token.organizationId = membership.organizationId;
          token.organizationName = membership.organization.name;
          token.role = membership.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.organizationId = String(token.organizationId ?? "");
        session.user.organizationName = String(token.organizationName ?? "");
        session.user.role = (token.role as Session["user"]["role"]) ?? "SALES_AGENT";
      }
      return session;
    },
  },
});
