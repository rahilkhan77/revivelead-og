import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { SignupForm } from "@/components/auth-forms";

export default function SignupPage() {
  return (
    <AuthCard title="Create your agency" subtitle="Owner account, isolated organization, 14-day Starter trial.">
      <SignupForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
