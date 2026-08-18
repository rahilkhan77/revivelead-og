import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { ForgotPasswordForm } from "@/components/auth-forms";
import { isClerkEnabled } from "@/lib/auth/clerk";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  if (isClerkEnabled()) redirect("/sign-in?reset=1");

  return (
    <AuthCard title="Reset password" subtitle="We will issue a reset link. In development it is shown on this page.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
