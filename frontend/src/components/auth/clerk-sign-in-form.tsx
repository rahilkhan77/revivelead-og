"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  AuthDivider,
  AuthError,
  AuthField,
  AuthFormSkeleton,
  AuthNotice,
  GoogleButton,
} from "@/components/auth/auth-fields";
import { clerkThrownMessage, firstClerkMessage, friendlyAuthMessage } from "@/lib/auth/clerk-errors";
import { browserOAuthUrls } from "@/lib/auth/clerk-oauth";

type Step = "sign-in" | "reset-email" | "reset-code" | "reset-password" | "verify";

function finishAt(router: ReturnType<typeof useRouter>, path: string) {
  return async ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
    const url = decorateUrl(path);
    if (url.startsWith("http")) {
      window.location.href = url;
      return;
    }
    router.push(url);
    router.refresh();
  };
}

export function ClerkSignInForm({ startReset = false }: { startReset?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { signIn, errors, fetchStatus } = useSignIn();
  const [step, setStep] = useState<Step>(startReset ? "reset-email" : "sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const busy = fetchStatus === "fetching";
  const statusStep: Step | null =
    signIn?.status === "needs_second_factor" || signIn?.status === "needs_client_trust"
      ? "verify"
      : signIn?.status === "needs_new_password"
        ? "reset-password"
        : null;
  const view = statusStep ?? step;
  const fieldError = useMemo(() => {
    return {
      email: errors?.fields?.identifier
        ? friendlyAuthMessage(errors.fields.identifier.code, errors.fields.identifier.longMessage ?? errors.fields.identifier.message)
        : null,
      password: errors?.fields?.password
        ? friendlyAuthMessage(errors.fields.password.code, errors.fields.password.longMessage ?? errors.fields.password.message)
        : null,
      code: errors?.fields?.code
        ? friendlyAuthMessage(errors.fields.code.code, errors.fields.code.longMessage ?? errors.fields.code.message)
        : null,
    };
  }, [errors]);
  const globalError = localError ?? firstClerkMessage(errors);

  useEffect(() => {
    if (authLoaded && isSignedIn && pathname === "/sign-in") {
      router.replace("/dashboard");
    }
  }, [authLoaded, isSignedIn, pathname, router]);

  async function complete() {
    if (!signIn || signIn.status !== "complete") return;
    await signIn.finalize({ navigate: finishAt(router, "/dashboard") });
  }

  async function onPasswordSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signIn) return;
    setLocalError(null);
    setNotice(null);
    const { error } = await signIn.password({ emailAddress: email.trim(), password });
    if (error) {
      setLocalError(friendlyAuthMessage(error.code, error.longMessage ?? error.message));
      return;
    }
    if (signIn.status === "needs_second_factor") {
      const factors = signIn.supportedSecondFactors.map((item) => item.strategy);
      if (factors.includes("email_code")) await signIn.mfa.sendEmailCode();
      else if (factors.includes("phone_code")) await signIn.mfa.sendPhoneCode();
      setStep("verify");
      setNotice("Verification required. Enter the code we sent you.");
      return;
    }
    if (signIn.status === "needs_client_trust") {
      await signIn.mfa.sendEmailCode();
      setStep("verify");
      setNotice("Verification required. Enter the code we sent you.");
      return;
    }
    await complete();
  }

  async function onGoogle() {
    if (!signIn) {
      setLocalError("Google sign-in is still loading. Try again in a moment.");
      return;
    }
    setLocalError(null);
    try {
      const { error } = await signIn.sso({
        strategy: "oauth_google",
        ...browserOAuthUrls("/sign-in/sso-callback", "/dashboard"),
      });
      if (error) {
        console.error("[ReviveLead] Clerk Google sign-in failed", error);
        setLocalError(friendlyAuthMessage(error.code, error.longMessage ?? error.message));
      }
    } catch (error) {
      console.error("[ReviveLead] Clerk Google sign-in failed", error);
      setLocalError(clerkThrownMessage(error));
    }
  }

  async function onSendReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signIn) return;
    setLocalError(null);
    const created = await signIn.create({ identifier: email.trim() });
    if (created.error) {
      setLocalError(friendlyAuthMessage(created.error.code, created.error.longMessage ?? created.error.message));
      return;
    }
    const sent = await signIn.resetPasswordEmailCode.sendCode();
    if (sent.error) {
      setLocalError(friendlyAuthMessage(sent.error.code, sent.error.longMessage ?? sent.error.message));
      return;
    }
    setNotice("Password reset email sent.");
    setStep("reset-code");
  }

  async function onVerifyReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signIn) return;
    setLocalError(null);
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
    if (error) {
      setLocalError(friendlyAuthMessage(error.code, error.longMessage ?? error.message));
      return;
    }
    setStep("reset-password");
  }

  async function onNewPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signIn) return;
    setLocalError(null);
    const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password });
    if (error) {
      setLocalError(friendlyAuthMessage(error.code, error.longMessage ?? error.message));
      return;
    }
    await complete();
  }

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signIn) return;
    setLocalError(null);
    const factors = signIn.supportedSecondFactors.map((item) => item.strategy);
    const result = factors.includes("totp")
      ? await signIn.mfa.verifyTOTP({ code: code.trim() })
      : factors.includes("phone_code")
        ? await signIn.mfa.verifyPhoneCode({ code: code.trim() })
        : await signIn.mfa.verifyEmailCode({ code: code.trim() });
    if (result.error) {
      setLocalError(friendlyAuthMessage(result.error.code, result.error.longMessage ?? result.error.message));
      return;
    }
    await complete();
  }

  if (isSignedIn) return <AuthFormSkeleton />;
  const ready = Boolean(signIn);
  const blocked = busy || !ready;

  if (view === "reset-email") {
    return (
      <form className="space-y-4" onSubmit={onSendReset}>
        <AuthNotice message={notice} />
        <AuthField label="Email" name="email" type="email" autoComplete="email" required value={email} onChange={setEmail} error={fieldError.email} />
        <AuthError message={globalError} />
        <Button type="submit" className="h-10 w-full" disabled={blocked}>
          {busy ? "Sending…" : "Send reset email"}
        </Button>
        <button type="button" className="w-full type-small text-muted-foreground underline-offset-4 hover:underline" onClick={() => setStep("sign-in")}>
          Back to sign in
        </button>
      </form>
    );
  }

  if (view === "reset-code") {
    return (
      <form className="space-y-4" onSubmit={onVerifyReset}>
        <AuthNotice message={notice ?? "Password reset email sent."} />
        <AuthField label="Reset code" name="code" autoComplete="one-time-code" required value={code} onChange={setCode} error={fieldError.code} />
        <AuthError message={globalError} />
        <Button type="submit" className="h-10 w-full" disabled={blocked}>
          {busy ? "Checking…" : "Continue"}
        </Button>
      </form>
    );
  }

  if (view === "reset-password") {
    return (
      <form className="space-y-4" onSubmit={onNewPassword}>
        <AuthField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={setPassword}
          error={fieldError.password}
        />
        <AuthError message={globalError} />
        <Button type="submit" className="h-10 w-full" disabled={blocked}>
          {busy ? "Saving…" : "Update password"}
        </Button>
      </form>
    );
  }

  if (view === "verify") {
    return (
      <form className="space-y-4" onSubmit={onVerify}>
        <AuthNotice message={notice ?? "Verification required."} />
        <AuthField label="Verification code" name="code" autoComplete="one-time-code" required value={code} onChange={setCode} error={fieldError.code} />
        <AuthError message={globalError} />
        <Button type="submit" className="h-10 w-full" disabled={blocked}>
          {busy ? "Verifying…" : "Verify"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <GoogleButton onClick={() => void onGoogle()} disabled={blocked} label="Continue with Google" />
      <AuthDivider />
      <form className="space-y-4" onSubmit={onPasswordSignIn}>
        <AuthField label="Email" name="email" type="email" autoComplete="email" required value={email} onChange={setEmail} error={fieldError.email} />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={setPassword}
          error={fieldError.password}
        />
        <div className="flex justify-end">
          <button
            type="button"
            className="type-small text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => {
              setNotice(null);
              setLocalError(null);
              setStep("reset-email");
            }}
          >
            Forgot password
          </button>
        </div>
        <AuthError message={globalError} />
        <Button type="submit" className="h-10 w-full" disabled={blocked}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="text-center type-small text-muted-foreground">
        New agency?{" "}
        <Link href="/sign-up" className="text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
