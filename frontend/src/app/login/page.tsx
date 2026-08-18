import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <AuthCard title="Sign in" subtitle="Use the Al Noor demo or your agency account.">
      <LoginForm />
      <p className="mt-4 text-center text-sm text-muted-foreground">
        New agency?{" "}
        <Link href="/signup" className="text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
