import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="font-heading text-4xl">Page not found</h1>
      <Button asChild>
        <Link href="/">Back to ReviveLead</Link>
      </Button>
    </div>
  );
}
