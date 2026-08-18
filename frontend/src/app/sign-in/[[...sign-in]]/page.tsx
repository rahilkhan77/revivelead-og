export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { ClerkSsoCallback } from "@/components/auth/sso-callback";
import { ClerkSignInForm } from "@/components/auth/clerk-sign-in-form";
import { isClerkEnabled } from "@/lib/auth/clerk";
import { getSessionUser } from "@/lib/authz";
import { isProduction } from "@/lib/env";

export default async function ClerkSignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ "sign-in"?: string[] }>;
  searchParams: Promise<{ reset?: string }>;
}) {
  if (!isClerkEnabled()) redirect("/login");

  const segments = (await params)["sign-in"] ?? [];
  if (segments.includes("sso-callback")) {
    return <ClerkSsoCallback title="Signing in" subtitle="Finishing Google sign-in." />;
  }

  if (segments.length === 0) {
    const user = await getSessionUser();
    if (user) redirect("/dashboard");
  }

  const query = await searchParams;
  const startReset = query.reset === "1";

  return (
    <AuthCard
      kicker="Agency workspace"
      title={startReset ? "Reset your password" : "Welcome back"}
      subtitle={
        startReset
          ? "Enter the email on your ReviveLead account. We will send a reset code."
          : "Sign in to recover pipeline, follow-ups and revenue."
      }
    >
      <ClerkSignInForm startReset={startReset} />
      {!isProduction() ? (
        <p className="mt-6 text-center type-small text-muted-foreground">
          Local demo?{" "}
          <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
            Sign in with email
          </Link>
        </p>
      ) : null}
    </AuthCard>
  );
}
