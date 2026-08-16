import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkEnabled } from "@/lib/auth/clerk";
import { getSessionUser } from "@/lib/authz";
import { db } from "@/lib/db";
import { safeCallbackPath } from "@/lib/http";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/leads(.*)",
  "/follow-ups(.*)",
  "/reactivation(.*)",
  "/team(.*)",
  "/revenue(.*)",
  "/automations(.*)",
  "/settings(.*)",
  "/billing(.*)",
  "/inbox(.*)",
  "/onboarding(.*)",
  "/intelligence(.*)",
  "/import(.*)",
  "/properties(.*)",
]);

const isPublicApi = createRouteMatcher([
  "/api/webhooks(.*)",
  "/api/cron(.*)",
  "/api/chat(.*)",
  "/api/ingest(.*)",
  "/api/auth(.*)",
]);

const clerkProxy = clerkMiddleware(
  async (auth, request) => {
    if (isPublicApi(request)) return;

    if (!isProtectedRoute(request)) return;

    if (isClerkEnabled()) {
      const { userId } = await auth();
      if (!userId) {
        const existing = await getSessionUser();
        if (!existing) {
          await auth.protect();
        }
      }
    }

    const user = await getSessionUser();
    if (!user) {
      const login = new URL(isClerkEnabled() ? "/sign-in" : "/login", request.url);
      login.searchParams.set(isClerkEnabled() ? "redirect_url" : "callbackUrl", safeCallbackPath(request.nextUrl.pathname));
      return NextResponse.redirect(login);
    }

    const org = await db.organization.findUnique({
      where: { id: user.organizationId },
      select: { onboardingCompleted: true, isDemo: true },
    });
    const needsOnboarding = Boolean(org && !org.onboardingCompleted && !org.isDemo);
    const pathname = request.nextUrl.pathname;
    const onboardingAllowed =
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/leads/import") ||
      pathname.startsWith("/import") ||
      pathname.startsWith("/team");
    if (needsOnboarding && !onboardingAllowed) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    if (!needsOnboarding && pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  },
);

export default clerkProxy;
export const proxy = clerkProxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
