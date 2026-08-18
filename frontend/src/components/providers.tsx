"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ThemedClerkProvider } from "@/components/clerk-theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({
  children,
  clerkEnabled,
}: {
  children: React.ReactNode;
  clerkEnabled: boolean;
}) {
  const tree = (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ThemedClerkProvider>
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </ThemedClerkProvider>
    </ThemeProvider>
  );

  if (clerkEnabled) return tree;

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {tree}
    </SessionProvider>
  );
}
