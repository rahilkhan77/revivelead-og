"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { AuthCard } from "@/components/auth-card";
import { AuthFormSkeleton } from "@/components/auth/auth-fields";

export function ClerkSsoCallback({
  title = "Continuing",
  subtitle = "Finishing Google sign-in.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <AuthCard kicker="ReviveLead" title={title} subtitle={subtitle}>
      <AuthenticateWithRedirectCallback
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/onboarding"
        continueSignUpUrl="/sign-up"
      />
      <AuthFormSkeleton />
      <p className="mt-4 text-center type-small text-muted-foreground">Please wait a moment.</p>
    </AuthCard>
  );
}
