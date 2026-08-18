import { notFound } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { InviteForm } from "@/components/auth-forms";
import { db } from "@/lib/db";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await db.invitation.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) notFound();

  return (
    <AuthCard title="Join your agency" subtitle="Set your name and password to accept the invitation.">
      <InviteForm token={token} email={invite.email} />
    </AuthCard>
  );
}
