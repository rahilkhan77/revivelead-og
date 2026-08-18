"use server";

import { revalidatePath } from "next/cache";
import { createApiKey, revokeApiKey } from "@/lib/api-keys";
import { ADMIN_ROLES } from "@/lib/constants";
import { fail, ok, toErrorMessage, withUser } from "@/lib/safe-action";

export async function createApiKeyAction(formData: FormData) {
  try {
    const user = await withUser();
    if (!ADMIN_ROLES.includes(user.role)) return fail("Admin access required.");
    const created = await createApiKey({
      organizationId: user.organizationId,
      createdById: user.id,
      name: String(formData.get("name") ?? "n8n / API"),
    });
    revalidatePath("/settings");
    return ok(created);
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function revokeApiKeyAction(formData: FormData) {
  try {
    const user = await withUser();
    if (!ADMIN_ROLES.includes(user.role)) return fail("Admin access required.");
    await revokeApiKey(user.organizationId, String(formData.get("id") ?? ""));
    revalidatePath("/settings");
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}
