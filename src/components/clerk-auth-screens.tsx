"use client";

import { ClerkFailed, ClerkLoaded, ClerkLoading, SignIn, SignUp, useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function RedirectIfSignedIn({ href, whenPath }: { href: string; whenPath: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && isSignedIn && pathname === whenPath) {
      router.replace(href);
    }
  }, [href, isLoaded, isSignedIn, pathname, router, whenPath]);

  return null;
}

export function ClerkSignInForm() {
  return (
    <div className="flex w-full justify-center">
      <RedirectIfSignedIn href="/dashboard" whenPath="/sign-in" />
      <ClerkLoading>
        <p className="text-sm text-muted-foreground">Loading sign in…</p>
      </ClerkLoading>
      <ClerkFailed>
        <p className="text-sm text-destructive">
          Sign in could not load. Refresh the page or use the email login below.
        </p>
      </ClerkFailed>
      <ClerkLoaded>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard"
          forceRedirectUrl="/dashboard"
        />
      </ClerkLoaded>
    </div>
  );
}

export function ClerkSignUpForm() {
  return (
    <div className="flex w-full justify-center">
      <RedirectIfSignedIn href="/onboarding" whenPath="/sign-up" />
      <ClerkLoading>
        <p className="text-sm text-muted-foreground">Loading sign up…</p>
      </ClerkLoading>
      <ClerkFailed>
        <p className="text-sm text-destructive">
          Sign up could not load. Refresh the page or use the email signup below.
        </p>
      </ClerkFailed>
      <ClerkLoaded>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/onboarding"
          forceRedirectUrl="/onboarding"
        />
      </ClerkLoaded>
    </div>
  );
}
