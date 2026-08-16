import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClerkCtaAuth, ClerkHeaderAuth, ClerkHeroAuth } from "@/components/clerk-auth-controls";
import { PLANS } from "@/lib/billing/plans";
import { isProduction } from "@/lib/env";

const problems = [
  "Leads wait hours before the first call.",
  "Follow-ups live in personal WhatsApp chats.",
  "Dormant inventory is never touched again.",
  "Managers cannot see which revenue is leaking.",
];

const steps = [
  { title: "Capture", body: "Every portal, website and walk-in lead lands in one pipeline, isolated by agency." },
  { title: "Qualify", body: "Each lead is scored for budget, area, intent and urgency so agents start with a brief, not a blank chat." },
  { title: "Follow up", body: "Configurable sequences send the first reply, reminders and manager alerts automatically." },
  { title: "Recover", body: "Dormant leads are reactivated with approved messages. Won deals are booked as recovered revenue." },
];

const features = [
  { title: "Lead workspace", body: "Status, score, assignment and conversation history on every record." },
  { title: "Lead qualification", body: "Budget, area, intent and a recommended next action — powered by AI, owned by the sales manager." },
  { title: "Follow-up engine", body: "Immediate response, no-reply nudges, dormant reactivation and agent alerts." },
  { title: "Conversation workspace", body: "WhatsApp-ready inbox with demo mode today and Cloud API credentials when you are ready." },
  { title: "Team performance", body: "See who responds, who qualifies, and who closes." },
  { title: "Automation + n8n", body: "Triggers and actions in-product, with webhooks for the rest of your stack." },
];

const faqs = [
  { q: "Is this built for Dubai brokerages?", a: "Yes. The product language, demo data and markets are Dubai, Qatar, Mumbai and Bangalore." },
  { q: "Do we need WhatsApp credentials on day one?", a: "No. Demo mode records outbound messages and simulates inbound replies. Connect the WhatsApp Cloud API when ready." },
  { q: "Can each agency keep data separate?", a: "Every record is scoped to an organization. Users never query another company's leads." },
  { q: "Is billing live?", a: "Plans, seats and lead limits are enforced. Paddle is the Merchant of Record when API keys are configured." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <p className="font-heading text-2xl">ReviveLead</p>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#product">Product</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <ClerkHeaderAuth />
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24">
        <p className="text-xs tracking-[0.22em] text-primary uppercase">Revenue recovery for real estate</p>
        <h1 className="font-heading mt-5 max-w-4xl text-5xl leading-[1.05] md:text-7xl">
          Turn Lost Real Estate Leads Into Revenue.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          ReviveLead is a revenue recovery platform for agencies. It captures every enquiry,
          keeps follow-ups on time, and reactivates dormant pipeline so paid leads do not expire
          in a WhatsApp chat.
        </p>
        <ClerkHeroAuth />
        {!isProduction() ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Local demo: owner@alnoor.ae / Demo1234!
          </p>
        ) : null}
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-2">
          <div>
            <p className="text-xs tracking-[0.22em] text-primary uppercase">The leak</p>
            <h2 className="font-heading mt-3 text-4xl">You already paid for these leads.</h2>
            <p className="mt-4 text-muted-foreground">
              Agencies in Dubai and the wider GCC spend heavily on portals, then lose the
              conversation in inboxes, night shifts and forgotten follow-ups.
            </p>
          </div>
          <ul className="space-y-3">
            {problems.map((item) => (
              <li key={item} className="border-border bg-background/60 rounded-xl border px-4 py-3 text-sm">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs tracking-[0.22em] text-primary uppercase">How it works</p>
        <h2 className="font-heading mt-3 text-4xl">A complete recovery loop.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-border p-5">
              <p className="text-xs text-muted-foreground">0{index + 1}</p>
              <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl border border-border bg-card p-6 md:p-10">
          <p className="text-xs tracking-[0.22em] text-primary uppercase">Product</p>
          <h2 className="font-heading mt-3 text-4xl">The desk your sales manager actually needs.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <ProductFrame title="Pipeline" metric="AED 34.4M" label="Recovered pipeline" />
            <ProductFrame title="Lead score" metric="92 HOT" label="Hassan Al Maktoum · Downtown" />
            <ProductFrame title="Follow-up" metric="5 due" label="First response under 15 minutes" />
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border p-5">
              <h3 className="font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs tracking-[0.22em] text-primary uppercase">Revenue recovery</p>
          <h2 className="font-heading mt-3 max-w-3xl text-4xl">
            The number that matters is not new leads. It is recovered ones.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Stat label="Dormant leads contacted" value="Campaign-ready" />
            <Stat label="Deals won from reactivation" value="Tracked" />
            <Stat label="Estimated recovered revenue" value="On the board" />
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs tracking-[0.22em] text-primary uppercase">Pricing</p>
        <h2 className="font-heading mt-3 text-4xl">Simple plans. Limits you can grow into.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col rounded-2xl border border-border p-6"
            >
              <p className="text-sm text-muted-foreground">{plan.name}</p>
              <p className="mt-3 text-3xl font-medium">
                {plan.priceMonthly ? `$${plan.priceMonthly}` : "Custom"}
                {plan.priceMonthly ? <span className="text-sm text-muted-foreground"> /mo</span> : null}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <ul className="mt-6 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button className="mt-6" asChild>
                <Link href="/sign-up">Choose {plan.name}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="font-heading text-4xl">Questions</h2>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {faqs.map((item) => (
            <div key={item.q} className="py-5">
              <p className="font-medium">{item.q}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 md:flex-row md:items-center">
          <div>
            <h2 className="font-heading text-4xl">Recover the pipeline you already paid for.</h2>
            <p className="mt-3 text-muted-foreground">Dubai, Qatar, Mumbai, Bangalore.</p>
          </div>
          <ClerkCtaAuth />
        </div>
      </section>
    </div>
  );
}

function ProductFrame({ title, metric, label }: { title: string; metric: string; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="font-heading mt-4 text-3xl">{metric}</p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-medium">{value}</p>
    </div>
  );
}
