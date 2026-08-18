"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-8">
        <h2 className="type-h3 text-lg">This page failed to load</h2>
        <p className="type-small mt-2 text-muted-foreground">Something went wrong. Try again.</p>
        <Button className="mt-4" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
