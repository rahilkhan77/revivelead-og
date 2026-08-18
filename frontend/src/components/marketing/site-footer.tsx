import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/company", label: "Company" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-2">
          <BrandLogo size="sm" />
          <p className="type-small text-muted-foreground">
            Revenue recovery for real-estate agencies. Dubai, Qatar, Mumbai, Bangalore.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="type-small text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-4 type-small text-muted-foreground sm:px-6">
          © 2026 ReviveLead. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
