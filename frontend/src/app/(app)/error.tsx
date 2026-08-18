"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-8">
      <h2 className="type-h3 text-lg">This view failed to load</h2>
      <p className="type-small mt-2 text-muted-foreground">Something went wrong. Try again.</p>
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
