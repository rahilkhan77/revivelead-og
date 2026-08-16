import { AuthCard } from "@/components/auth-card";
import { ForgotPasswordForm } from "@/components/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset password" subtitle="We will issue a reset link. In development it is shown on this page.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
