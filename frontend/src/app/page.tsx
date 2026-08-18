import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { ClerkCtaAuth, ClerkHeroAuth } from "@/components/clerk-auth-controls";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { PricingPlanLink } from "@/components/marketing/pricing-plan-link";
import { Reveal } from "@/components/motion/reveal";
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
  { q: "Is billing live?", a: "Plans, seats and lead limits are enforced. Razorpay processes paid subscriptions. Access updates only after server-side payment verification." },
];

const images = {
  skyline:
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=70",
  interior:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=70",
  keys: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=70",
  meeting:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=70",
  villa:
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=70",
};

export default function LandingPage() {
  return (
    <MarketingShell>
      <section className="hero-mesh relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 pt-16 pb-20 sm:px-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-center md:pt-24 md:pb-28">
          <div>
            <p className="type-kicker animate-fade-up">Revenue recovery for real estate</p>
            <h1 className="type-display mt-5 max-w-4xl animate-fade-up" style={{ animationDelay: "80ms" }}>
              Turn lost leads back into revenue.
            </h1>
            <p
              className="type-body mt-6 max-w-xl text-muted-foreground animate-fade-up"
              style={{ animationDelay: "150ms" }}
            >
              ReviveLead helps agencies recover inactive and forgotten enquiries — capturing every lead,
              keeping follow-ups on time, and reactivating dormant pipeline before paid traffic expires
              in a chat thread.
            </p>
            <div className="animate-fade-up" style={{ animationDelay: "220ms" }}>
              <ClerkHeroAuth />
            </div>
            {!isProduction() ? (
              <p className="type-small mt-4 text-muted-foreground">Local demo: owner@alnoor.ae / Demo1234!</p>
            ) : null}
          </div>
          <div className="relative min-h-[280px] overflow-hidden rounded-lg border border-border shadow-sm md:min-h-[420px]">
            <Image
              src={images.skyline}
              alt="City skyline of towers and waterfront development"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 42vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
            <p className="absolute right-4 bottom-4 left-4 type-small text-background drop-shadow-sm dark:text-foreground">
              Built for agencies working high-intent property enquiries across Dubai, Qatar, Mumbai and Bangalore.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center">
          <Reveal>
            <p className="type-kicker">The leak</p>
            <h2 className="type-h2 mt-3">You already paid for these leads.</h2>
            <p className="type-body mt-4 text-muted-foreground">
              Agencies spend heavily on portals, then lose the conversation in inboxes, night shifts and
              forgotten follow-ups. ReviveLead puts that pipeline back on the desk.
            </p>
            <ul className="mt-8 space-y-3">
              {problems.map((item) => (
                <li key={item} className="surface-card px-4 py-3 type-small">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delayMs={80}>
            <div className="relative aspect-4/5 overflow-hidden rounded-lg border border-border md:aspect-4/3">
              <Image
                src={images.interior}
                alt="Interior of a contemporary residential property"
                fill
                sizes="(max-width: 768px) 100vw, 46vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <p className="type-kicker">How it works</p>
          <h2 className="type-h2 mt-3">A complete recovery loop.</h2>
        </Reveal>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.title} delayMs={index * 60}>
              <div className="surface-card h-full p-5">
                <p className="type-small text-muted-foreground">0{index + 1}</p>
                <h3 className="type-h3 mt-4">{step.title}</h3>
                <p className="type-small mt-2 text-muted-foreground">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="product" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <Reveal>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 md:p-10">
                <p className="type-kicker">Product</p>
                <h2 className="type-h2 mt-3">The desk your sales manager actually needs.</h2>
                <p className="type-body mt-4 max-w-lg text-muted-foreground">
                  Pipeline, qualification and follow-up in one workspace — so agents start with context,
                  not a blank chat.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <ProductFrame title="Pipeline" metric="AED 34.4M" label="Recovered pipeline" />
                  <ProductFrame title="Lead score" metric="92 HOT" label="Hassan Al Maktoum · Downtown" />
                  <ProductFrame title="Follow-up" metric="5 due" label="First response under 15 minutes" />
                </div>
              </div>
              <div className="relative min-h-[240px]">
                <Image
                  src={images.meeting}
                  alt="Sales team reviewing property leads in a meeting"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delayMs={index * 40}>
              <div className="surface-card h-full p-5">
                <h3 className="type-h3">{feature.title}</h3>
                <p className="type-small mt-2 text-muted-foreground">{feature.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center">
          <Reveal>
            <div className="relative aspect-16/11 overflow-hidden rounded-lg border border-border">
              <Image
                src={images.keys}
                alt="House keys on a contract for a property handover"
                fill
                sizes="(max-width: 768px) 100vw, 46vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delayMs={80}>
            <p className="type-kicker">Revenue recovery</p>
            <h2 className="type-h2 mt-3">The number that matters is not new leads. It is recovered ones.</h2>
            <p className="type-body mt-4 text-muted-foreground">
              Track dormant contacts, reactivation campaigns and deals that came back — without mixing
              recovered revenue into ordinary closings.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Stat label="Dormant leads contacted" value="Campaign-ready" />
              <Stat label="Deals won from reactivation" value="Tracked" />
              <Stat label="Estimated recovered revenue" value="On the board" />
            </div>
          </Reveal>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <p className="type-kicker">Pricing</p>
          <h2 className="type-h2 mt-3">Simple plans. Limits you can grow into.</h2>
        </Reveal>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {PLANS.map((plan, index) => (
            <Reveal key={plan.id} delayMs={index * 60}>
              <div className="surface-card flex h-full flex-col p-6">
                <p className="type-small text-muted-foreground">{plan.name}</p>
                <p className="mt-3 text-3xl font-medium tracking-tight">
                  {plan.priceMonthly ? `$${plan.priceMonthly}` : "Custom"}
                  {plan.priceMonthly ? <span className="text-sm font-normal text-muted-foreground"> /mo</span> : null}
                </p>
                <p className="type-small mt-2 text-muted-foreground">{plan.description}</p>
                <ul className="mt-6 flex-1 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 type-small">
                      <Check className="mt-0.5 size-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <PricingPlanLink planName={plan.name} custom={!plan.priceMonthly} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="type-h2">Questions</h2>
            <Link href="/faqs" className="type-small text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              All FAQs
            </Link>
          </div>
        </Reveal>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {faqs.map((item) => (
            <Reveal key={item.q}>
              <div className="py-5">
                <p className="type-h3">{item.q}</p>
                <p className="type-small mt-2 text-muted-foreground">{item.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border">
        <Image
          src={images.villa}
          alt="Luxury residential property at dusk"
          fill
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-background/75" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-20 sm:px-6 md:flex-row md:items-center">
          <div>
            <h2 className="type-h2 max-w-xl">Recover the pipeline you already paid for.</h2>
            <p className="type-body mt-3 text-muted-foreground">Dubai, Qatar, Mumbai, Bangalore.</p>
          </div>
          <ClerkCtaAuth />
        </div>
      </section>

    </MarketingShell>
  );
}

function ProductFrame({ title, metric, label }: { title: string; metric: string; label: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <p className="type-small text-muted-foreground">{title}</p>
      <p className="mt-3 text-2xl font-medium tracking-tight">{metric}</p>
      <p className="type-small mt-1 text-muted-foreground">{label}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <p className="type-small text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-medium tracking-tight">{value}</p>
    </div>
  );
}
