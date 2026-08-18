import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { className: "h-6 w-auto", width: 148, height: 32 },
  md: { className: "h-7 w-auto", width: 168, height: 36 },
  lg: { className: "h-8 w-auto", width: 196, height: 42 },
} as const;

export function BrandLogo({
  href = "/",
  className,
  size = "md",
  priority = false,
}: {
  href?: string;
  className?: string;
  size?: keyof typeof sizes;
  priority?: boolean;
}) {
  const frame = sizes[size];

  return (
    <Link href={href} className={cn("inline-flex items-center", className)} aria-label="ReviveLead home">
      <Image
        src="/brand/wordmark-dark.png"
        alt="ReviveLead"
        width={frame.width}
        height={frame.height}
        className={cn(frame.className, "dark:hidden")}
        priority={priority}
      />
      <Image
        src="/brand/wordmark-light.png"
        alt=""
        width={frame.width}
        height={frame.height}
        className={cn(frame.className, "hidden dark:block")}
        priority={priority}
      />
    </Link>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/favicon.png"
      alt=""
      width={36}
      height={36}
      className={cn("size-8 rounded-md", className)}
    />
  );
}
