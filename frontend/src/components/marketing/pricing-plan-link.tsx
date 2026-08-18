"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PricingPlanLink({ planName, custom }: { planName: string; custom?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (custom) {
    return (
      <Button className="mt-6 h-10" asChild>
        <Link href="/contact">Talk to us</Link>
      </Button>
    );
  }
  const href = isLoaded && isSignedIn ? "/billing" : "/sign-up";
  return (
    <Button className="mt-6 h-10" asChild>
      <Link href={href}>Choose {planName}</Link>
    </Button>
  );
}
