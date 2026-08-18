import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Reveal } from "@/components/motion/reveal";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata = marketingMetadata(
  "Company",
  "ReviveLead is a software service for international B2B real-estate agencies, operated from India.",
  "/company",
);

const sections = [
  {
    title: "Overview",
    body: "ReviveLead is a software service for international B2B real-estate agencies and businesses. It helps teams organize incoming enquiries, keep follow-ups on time, and recover dormant pipeline so paid leads are not left in personal inboxes.",
  },
  {
    title: "What ReviveLead does",
    body: "Agencies capture portal, website, and walk-in leads in one workspace. Each record can be scored for budget, area, intent, and urgency. Configurable sequences send the first reply, reminders, and manager alerts. Dormant leads can be reactivated with approved messages, and won deals from that work are tracked as recovered revenue.",
  },
  {
    title: "Who it is built for",
    body: "ReviveLead is built for real-estate agencies and sales teams that buy leads and need a shared desk — not a personal WhatsApp chat. The product language and markets are Dubai, Qatar, Mumbai, and Bangalore, and the service is designed for international B2B use.",
  },
  {
    title: "The problem it solves",
    body: "Agencies already pay for portal traffic. Those enquiries often wait hours for a first call, live in individual phones, and are never touched again once they go quiet. Managers cannot see which revenue is leaking. ReviveLead puts that pipeline back on one desk.",
  },
  {
    title: "Lead recovery and follow-up",
    body: "Lead recovery means contacting inactive or forgotten enquiries and measuring the deals that come back — separately from ordinary closings. Follow-up sequences cover the first response, no-reply nudges, dormant reactivation, and agent alerts.",
  },
  {
    title: "AI-assisted workflows",
    body: "ReviveLead uses AI and automation for lead analysis, recommended next actions, and follow-up assistance. Outputs may contain errors or omissions. Customers remain responsible for reviewing them before relying on or sending them.",
  },
];

export default function CompanyPage() {
  return (
    <MarketingShell>
      <article className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-3xl">
          <Reveal>
            <p className="type-kicker">Company</p>
            <h1 className="type-h1 mt-4 text-[2.15rem] sm:text-[2.6rem]">ReviveLead</h1>
            <p className="type-body mt-5 text-muted-foreground">
              A revenue-recovery product for real-estate teams — operated from India, built for
              international agencies.
            </p>
          </Reveal>

          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <Reveal key={section.title}>
                <section>
                  <h2 className="type-h3">{section.title}</h2>
                  <p className="type-body mt-3 text-muted-foreground">{section.body}</p>
                </section>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <section className="mt-14 border-t border-border pt-10">
              <h2 className="type-h3">How the brand is operated</h2>
              <p className="type-body mt-3 text-muted-foreground">
                ReviveLead is a software service operated from India. It is currently not operated
                through a registered company entity.
              </p>
            </section>
          </Reveal>

          <Reveal>
            <section className="mt-10">
              <h2 className="type-h3">Contact and support</h2>
              <ul className="mt-4 space-y-2 type-small">
                <li>
                  General and support:{" "}
                  <a className="underline underline-offset-4" href="mailto:support@revivelead.io">
                    support@revivelead.io
                  </a>
                </li>
                <li>
                  Privacy and data requests:{" "}
                  <a className="underline underline-offset-4" href="mailto:privacy@revivelead.io">
                    privacy@revivelead.io
                  </a>
                </li>
                <li>
                  Website:{" "}
                  <a className="underline underline-offset-4" href="https://revivelead.io">
                    revivelead.io
                  </a>
                </li>
              </ul>
              <p className="type-small mt-6 text-muted-foreground">
                Read the{" "}
                <Link href="/privacy-policy" className="underline underline-offset-4">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="/terms" className="underline underline-offset-4">
                  Terms & Conditions
                </Link>
                .
              </p>
            </section>
          </Reveal>
        </div>
      </article>
    </MarketingShell>
  );
}
