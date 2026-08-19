"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth, useSignUp } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  AuthDivider,
  AuthError,
  AuthField,
  AuthFormSkeleton,
  AuthNotice,
  GoogleButton,
} from "@/components/auth/auth-fields";
import { firstClerkMessage, friendlyAuthMessage, clerkThrownMessage } from "@/lib/auth/clerk-errors";
import { browserOAuthUrls } from "@/lib/auth/clerk-oauth";

function splitName(value: string) {
  const trimmed = value.trim();
  const space = trimmed.indexOf(" ");
  if (space === -1) return { firstName: trimmed, lastName: undefined as string | undefined };
  return {
    firstName: trimmed.slice(0, space),
    lastName: trimmed.slice(space + 1).trim() || undefined,
  };
}

export function ClerkSignUpForm() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const busy = fetchStatus === "fetching";
  const needsEmailVerification = Boolean(
    signUp &&
      signUp.status === "missing_requirements" &&
      signUp.unverifiedFields.includes("email_address") &&
      signUp.missingFields.filter((field) => field !== "email_address").length === 0,
  );
  const fieldError = useMemo(() => {
    return {
      email: errors?.fields?.emailAddress
        ? friendlyAuthMessage(errors.fields.emailAddress.code, errors.fields.emailAddress.longMessage ?? errors.fields.emailAddress.message)
        : null,
      password: errors?.fields?.password
        ? friendlyAuthMessage(errors.fields.password.code, errors.fields.password.longMessage ?? errors.fields.password.message)
        : null,
      code: errors?.fields?.code
        ? friendlyAuthMessage(errors.fields.code.code, errors.fields.code.longMessage ?? errors.fields.code.message)
        : null,
      captcha: errors?.fields?.captcha
        ? friendlyAuthMessage(errors.fields.captcha.code, errors.fields.captcha.longMessage ?? errors.fields.captcha.message)
        : null,
    };
  }, [errors]);
  const globalError = localError ?? fieldError.captcha ?? firstClerkMessage(errors);

  useEffect(() => {
    if (authLoaded && isSignedIn && pathname === "/sign-up") {
      router.replace("/onboarding");
    }
  }, [authLoaded, isSignedIn, pathname, router]);

  async function complete() {
    if (!signUp || signUp.status !== "complete") return;
    await signUp.finalize({
      navigate: async ({ decorateUrl }) => {
        const url = decorateUrl("/onboarding");
        if (url.startsWith("http")) {
          window.location.href = url;
          return;
        }
        router.push(url);
        router.refresh();
      },
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signUp) return;
    setLocalError(null);
    const { firstName, lastName } = splitName(name);
    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
      firstName,
      lastName,
    });
    if (error) {
      setLocalError(
        error.code === "form_identifier_exists"
          ? "An account with this email already exists."
          : friendlyAuthMessage(error.code, error.longMessage ?? error.message),
      );
      return;
    }
    if (signUp.isTransferable) {
      setLocalError("An account with this email already exists.");
      return;
    }
    if (signUp.status === "complete") {
      await complete();
      return;
    }
    if (signUp.unverifiedFields.includes("email_address")) {
      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) {
        setLocalError(friendlyAuthMessage(sent.error.code, sent.error.longMessage ?? sent.error.message));
        return;
      }
      setNotice("Verification required. Enter the code we emailed you.");
    }
  }

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signUp) return;
    setLocalError(null);
    const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
    if (error) {
      setLocalError(friendlyAuthMessage(error.code, error.longMessage ?? error.message));
      return;
    }
    await complete();
  }

  async function onResend() {
    if (!signUp) return;
    setLocalError(null);
    const { error } = await signUp.verifications.sendEmailCode();
    if (error) {
      setLocalError(friendlyAuthMessage(error.code, error.longMessage ?? error.message));
      return;
    }
    setNotice("A new verification code was sent.");
  }

  async function onGoogle() {
    if (!signUp) {
      setLocalError("Google sign-up is still loading. Try again in a moment.");
      return;
    }
    setLocalError(null);
    try {
      const { error } = await signUp.sso({
        strategy: "oauth_google",
        ...browserOAuthUrls("/sign-up/sso-callback", "/onboarding"),
      });
      if (error) {
        console.error("[ReviveLead] Clerk Google sign-up failed", error);
        setLocalError(friendlyAuthMessage(error.code, error.longMessage ?? error.message));
      }
    } catch (error) {
      console.error("[ReviveLead] Clerk Google sign-up failed", error);
      setLocalError(clerkThrownMessage(error));
    }
  }

  if (isSignedIn) return <AuthFormSkeleton />;
  const ready = Boolean(signUp);
  const blocked = busy || !ready;

  if (needsEmailVerification) {
    return (
      <form className="space-y-4" onSubmit={onVerify}>
        <AuthNotice message={notice ?? "Verification required. Enter the code we emailed you."} />
        <AuthField label="Verification code" name="code" autoComplete="one-time-code" required value={code} onChange={setCode} error={fieldError.code} />
        <AuthError message={globalError} />
        <Button type="submit" className="h-10 w-full" disabled={blocked}>
          {busy ? "Verifying…" : "Verify email"}
        </Button>
        <button type="button" className="w-full type-small text-muted-foreground underline-offset-4 hover:underline" onClick={() => void onResend()} disabled={busy}>
          Resend code
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <GoogleButton onClick={() => void onGoogle()} disabled={blocked} label="Continue with Google" />
      <AuthDivider />
      <form className="space-y-4" onSubmit={onSubmit}>
        <AuthField label="Name" name="name" autoComplete="name" required value={name} onChange={setName} />
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={setEmail}
          error={fieldError.email}
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={setPassword}
          error={fieldError.password}
        />
        <div id="clerk-captcha" />
        <AuthError message={globalError} />
        <Button type="submit" className="h-10 w-full" disabled={blocked}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="text-center type-small text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
