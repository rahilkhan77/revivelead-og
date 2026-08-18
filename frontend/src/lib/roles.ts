import type { Role } from "@prisma/client";
import { z } from "zod";
import { ADMIN_ROLES, MANAGER_ROLES } from "@/lib/constants";

export const inviteRoleSchema = z.enum(["SALES_AGENT", "SALES_MANAGER", "ADMIN"]);
export const memberRoleSchema = z.enum(["OWNER", "ADMIN", "SALES_MANAGER", "SALES_AGENT"]);

export function isManager(role: Role) {
  return MANAGER_ROLES.includes(role);
}

export function isAdmin(role: Role) {
  return ADMIN_ROLES.includes(role);
}

export function canViewAllLeads(role: Role) {
  return isManager(role);
}
