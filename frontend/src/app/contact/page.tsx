import { Mail, Shield, Globe } from "lucide-react";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Reveal } from "@/components/motion/reveal";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata = marketingMetadata(
  "Contact",
  "Contact ReviveLead for support, billing questions, or privacy and data requests.",
  "/contact",
);

const channels = [
  {
    icon: Mail,
    label: "General and support",
    detail: "Account, billing, or technical questions.",
    href: "mailto:support@revivelead.io",
    value: "support@revivelead.io",
  },
  {
    icon: Shield,
    label: "Privacy and data requests",
    detail: "Access, correction, deletion, and other privacy questions.",
    href: "mailto:privacy@revivelead.io",
    value: "privacy@revivelead.io",
  },
  {
    icon: Globe,
    label: "Website",
    detail: "Product, plans, and the ReviveLead workspace.",
    href: "https://revivelead.io",
    value: "revivelead.io",
  },
];

export default function ContactPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-3xl">
          <Reveal>
            <p className="type-kicker">Contact</p>
            <h1 className="type-h1 mt-4 text-[2.15rem] sm:text-[2.6rem]">How to reach us</h1>
            <p className="type-body mt-5 max-w-xl text-muted-foreground">
              There is no in-app contact form on this page. Use the addresses below and we will reply
              by email.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-3">
            {channels.map((channel, index) => (
              <Reveal key={channel.value} delayMs={index * 60}>
                <a
                  href={channel.href}
                  className="surface-card flex items-start gap-4 p-5 transition-colors hover:bg-muted/30"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                    <channel.icon className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="type-h3 block">{channel.label}</span>
                    <span className="type-small mt-1 block text-muted-foreground">{channel.detail}</span>
                    <span className="mt-2 block text-sm font-medium underline underline-offset-4">
                      {channel.value}
                    </span>
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
