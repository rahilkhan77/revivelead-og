import type { Role } from "@prisma/client";
import { ADMIN_ROLES, MANAGER_ROLES } from "@/lib/constants";

export function isManager(role: Role) {
  return MANAGER_ROLES.includes(role);
}

export function isAdmin(role: Role) {
  return ADMIN_ROLES.includes(role);
}

export function canViewAllLeads(role: Role) {
  return isManager(role);
}
