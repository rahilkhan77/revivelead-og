"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  acceptInviteAction,
  loginAction,
  requestPasswordResetAction,
  resetPasswordAction,
  signupAction,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MARKETS } from "@/lib/constants";

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} />
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const result = await loginAction(new FormData(event.currentTarget));
        setPending(false);
        if (!result.ok) {
          setError(result.error ?? "Unable to sign in.");
          return;
        }
        router.push(result.data?.redirectTo ?? "/dashboard");
        router.refresh();
      }}
    >
      <Field label="Email" name="email" type="email" required defaultValue="owner@alnoor.ae" />
      <Field label="Password" name="password" type="password" required defaultValue="Demo1234!" />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="underline-offset-4 hover:underline">
          Forgot password
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const result = await signupAction(new FormData(event.currentTarget));
        setPending(false);
        if (!result.ok) {
          setError(result.error ?? "Unable to create account.");
          return;
        }
        router.push(result.data?.redirectTo ?? "/onboarding");
        router.refresh();
      }}
    >
      <Field label="Your name" name="name" required />
      <Field label="Work email" name="email" type="email" required />
      <Field label="Password" name="password" type="password" required />
      <Field label="Agency name" name="organizationName" required />
      <div className="space-y-1.5">
        <Label htmlFor="market">Market</Label>
        <select
          id="market"
          name="market"
          className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm"
          defaultValue="Dubai"
        >
          {MARKETS.map((market) => (
            <option key={market} value={market}>
              {market}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating agency..." : "Create agency"}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const result = await requestPasswordResetAction(new FormData(event.currentTarget));
        if (!result.ok) {
          setError(result.error ?? "Unable to send reset.");
          return;
        }
        setMessage(
          result.data?.resetUrl
            ? `Reset link (dev): ${result.data.resetUrl}`
            : "If that email exists, a reset link has been issued.",
        );
      }}
    >
      <Field label="Email" name="email" type="email" required />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-muted-foreground break-all">{message}</p> : null}
      <Button type="submit" className="w-full">
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await resetPasswordAction(new FormData(event.currentTarget));
        if (!result.ok) {
          setError(result.error ?? "Unable to reset password.");
          return;
        }
        router.push("/login");
      }}
    >
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <Field label="New password" name="password" type="password" required />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full">
        Update password
      </Button>
    </form>
  );
}

export function InviteForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await acceptInviteAction(new FormData(event.currentTarget));
        if (!result.ok) {
          setError(result.error ?? "Unable to accept invite.");
          return;
        }
        router.push("/dashboard");
        router.refresh();
      }}
    >
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-muted-foreground">Invited as {email}</p>
      <Field label="Your name" name="name" required />
      <Field label="Password" name="password" type="password" required />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="w-full">
        Join agency
      </Button>
    </form>
  );
}
