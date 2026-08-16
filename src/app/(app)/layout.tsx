import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/authz";
import { db } from "@/lib/db";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await db.notification.count({
    where: { userId: user.id, organizationId: user.organizationId, readAt: null },
  });

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        organizationName: user.organizationName,
      }}
      unread={unread}
    >
      {children}
    </AppShell>
  );
}
