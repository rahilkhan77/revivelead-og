import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { UnreadNotificationsDot } from "@/components/unread-notifications-dot";
import { getOrganizationFlags, requireUser } from "@/lib/authz";

function onboardingAllowed(pathname: string) {
  return (
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/leads/import") ||
    pathname.startsWith("/import") ||
    pathname.startsWith("/team")
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const pathname = (await headers()).get("x-revivelead-path") ?? "";
  const org = await getOrganizationFlags(user.organizationId);
  const needsOnboarding = Boolean(org && !org.onboardingCompleted && !org.isDemo);
  if (pathname && needsOnboarding && !onboardingAllowed(pathname)) {
    redirect("/onboarding");
  }
  if (pathname && !needsOnboarding && pathname.startsWith("/onboarding")) {
    redirect("/dashboard");
  }

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        organizationName: user.organizationName,
      }}
      unreadSlot={
        <Suspense fallback={null}>
          <UnreadNotificationsDot userId={user.id} organizationId={user.organizationId} />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
