import { getSessionUser } from "@/lib/authz";
import { resolveOrgFromApiKey } from "@/lib/api-keys";
import { resolveOrgFromSecret } from "@/lib/org";

export { assertMemberInOrganization, requireCronSecret, resolveOrgFromSecret } from "@/lib/org";

export async function resolveOrgFromRequest(request: Request) {
  const apiKey = request.headers.get("x-api-key") ?? request.headers.get("x-revivelead-secret");
  const fromHashed = await resolveOrgFromApiKey(apiKey);
  if (fromHashed) return fromHashed;
  const fromSecret = await resolveOrgFromSecret(apiKey, ["WEBHOOK", "N8N"]);
  if (fromSecret) return fromSecret;
  const session = await getSessionUser();
  return session?.organizationId ?? null;
}
