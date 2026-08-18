import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    organizationId?: string;
    organizationName?: string;
    role?: Role;
  }

  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      organizationId: string;
      organizationName: string;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    organizationId?: string;
    organizationName?: string;
    role?: Role;
  }
}
