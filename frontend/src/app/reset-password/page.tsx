import { AuthCard } from "@/components/auth-card";
import { ResetPasswordForm } from "@/components/auth-forms";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthCard title="Choose a new password" subtitle="This link expires after one hour.">
      <ResetPasswordForm email={params.email ?? ""} token={params.token ?? ""} />
    </AuthCard>
  );
}
