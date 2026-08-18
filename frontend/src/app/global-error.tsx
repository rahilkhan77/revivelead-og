"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center px-4 py-16">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card p-8">
            <h2 className="text-lg font-medium tracking-tight">ReviveLead failed to load</h2>
            <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again.</p>
            <Button className="mt-4" onClick={reset}>
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
