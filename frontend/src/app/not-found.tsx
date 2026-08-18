import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="hero-mesh flex min-h-screen flex-col items-center justify-center gap-5 px-4">
      <BrandLogo />
      <h1 className="type-h1">Page not found</h1>
      <p className="type-small text-muted-foreground">That route does not exist in ReviveLead.</p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
