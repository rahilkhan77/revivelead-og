"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ClerkHeaderAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
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
      <Button variant="ghost" asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild>
        <Link href="/sign-up">Start free trial</Link>
      </Button>
    </div>
  );
}

export function ClerkHeroAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  if (isLoaded && isSignedIn) {
    return (
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" className="h-11 px-5" asChild>
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
        <UserButton />
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Button size="lg" className="h-11 px-5" asChild>
        <Link href="/sign-up">Create your agency</Link>
      </Button>
      <Button size="lg" variant="outline" className="h-11 px-5" asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
    </div>
  );
}

export function ClerkCtaAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && isSignedIn) return null;

  return (
    <Button size="lg" className="h-11 px-5" asChild>
      <Link href="/sign-up">Start ReviveLead</Link>
    </Button>
  );
}
