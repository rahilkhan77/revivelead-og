export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { ClerkSignUpForm } from "@/components/clerk-auth-screens";
import { isClerkEnabled } from "@/lib/auth/clerk";
import { getSessionUser } from "@/lib/authz";
import { isProduction } from "@/lib/env";

export default async function ClerkSignUpPage({
  params,
}: {
  params: Promise<{ "sign-up"?: string[] }>;
}) {
  if (!isClerkEnabled()) redirect("/signup");

  const segments = (await params)["sign-up"] ?? [];
  if (segments.length === 0) {
    const user = await getSessionUser();
    if (user) redirect("/dashboard");
  }

  return (
    <AuthCard title="Create your agency" subtitle="Start ReviveLead for your real estate team.">
      <ClerkSignUpForm />
      {!isProduction() ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Prefer email?{" "}
          <Link href="/signup" className="text-foreground underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      ) : null}
    </AuthCard>
  );
}
