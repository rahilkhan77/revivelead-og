"use client";

import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ClerkHeaderAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div className="h-9 w-40" />;
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <UserButton />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
        <Button variant="ghost">Sign in</Button>
      </SignInButton>
      <SignUpButton mode="redirect" forceRedirectUrl="/onboarding">
        <Button>Start free trial</Button>
      </SignUpButton>
    </div>
  );
}

export function ClerkHeroAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div className="mt-8 h-11" />;
  }

  if (isSignedIn) {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" asChild>
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
        <UserButton />
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <SignUpButton mode="redirect" forceRedirectUrl="/onboarding">
        <Button size="lg">Create your agency</Button>
      </SignUpButton>
      <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
        <Button size="lg" variant="outline">
          Sign in
        </Button>
      </SignInButton>
    </div>
  );
}

export function ClerkCtaAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || isSignedIn) return null;

  return (
    <SignUpButton mode="redirect" forceRedirectUrl="/onboarding">
      <Button size="lg">Start ReviveLead</Button>
    </SignUpButton>
  );
}
