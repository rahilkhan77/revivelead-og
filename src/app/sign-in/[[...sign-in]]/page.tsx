export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { ClerkSignInForm } from "@/components/clerk-auth-screens";
import { isClerkEnabled } from "@/lib/auth/clerk";
import { getSessionUser } from "@/lib/authz";
import { isProduction } from "@/lib/env";

export default async function ClerkSignInPage({
  params,
}: {
  params: Promise<{ "sign-in"?: string[] }>;
}) {
  if (!isClerkEnabled()) redirect("/login");

  const segments = (await params)["sign-in"] ?? [];
  if (segments.length === 0) {
    const user = await getSessionUser();
    if (user) redirect("/dashboard");
  }

  return (
    <AuthCard title="Sign in" subtitle="Use your agency account to open the ReviveLead workspace.">
      <ClerkSignInForm />
      {!isProduction() ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Local demo?{" "}
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Sign in with email
          </Link>
        </p>
      ) : null}
    </AuthCard>
  );
}
