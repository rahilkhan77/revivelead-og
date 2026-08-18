import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Reveal } from "@/components/motion/reveal";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata = marketingMetadata(
  "About",
  "Why ReviveLead exists: recover lost and dormant real-estate leads and turn them back into follow-up and revenue.",
  "/about",
);

const images = {
  skyline:
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=70",
  interior:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=70",
};

export default function AboutPage() {
  return (
    <MarketingShell>
      <article>
        <section className="hero-mesh">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 pt-16 pb-20 sm:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-center md:pt-24">
            <div>
              <p className="type-kicker animate-fade-up">About</p>
              <h1 className="type-display mt-5 max-w-3xl animate-fade-up" style={{ animationDelay: "80ms" }}>
                Paid leads should not go quiet.
              </h1>
              <p
                className="type-body mt-6 max-w-xl text-muted-foreground animate-fade-up"
                style={{ animationDelay: "150ms" }}
              >
                ReviveLead exists because real-estate agencies already buy attention — then lose the
                conversation in night shifts, personal WhatsApp threads, and forgotten follow-ups.
              </p>
            </div>
            <div className="relative min-h-[240px] overflow-hidden rounded-lg border border-border md:min-h-[380px]">
              <Image
                src={images.skyline}
                alt="City skyline of towers and waterfront development"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center">
            <Reveal>
              <p className="type-kicker">The problem</p>
              <h2 className="type-h2 mt-3">Dormant pipeline is still pipeline.</h2>
              <p className="type-body mt-4 text-muted-foreground">
                A lead that went silent is not automatically worthless. It is often an enquiry the
                agency already paid for — waiting for a structured second attempt, a manager who can
                see the leak, and a record that is not trapped on one agent&apos;s phone.
              </p>
            </Reveal>
            <Reveal delayMs={80}>
              <div className="relative aspect-4/3 overflow-hidden rounded-lg border border-border">
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
          <div className="grid gap-10 md:grid-cols-3">
            <Reveal>
              <h2 className="type-h3">Why ReviveLead exists</h2>
              <p className="type-small mt-3 text-muted-foreground">
                To give agencies one workspace for capture, qualification, follow-up, and
                reactivation — so missed opportunities become work that can actually be done.
              </p>
            </Reveal>
            <Reveal delayMs={60}>
              <h2 className="type-h3">Product philosophy</h2>
              <p className="type-small mt-3 text-muted-foreground">
                The desk belongs to the sales manager. AI can draft a brief and a next action.
                People decide what gets sent. Recovered revenue is counted only when a reactivated
                lead is won.
              </p>
            </Reveal>
            <Reveal delayMs={120}>
              <h2 className="type-h3">International B2B</h2>
              <p className="type-small mt-3 text-muted-foreground">
                Built for agencies working high-intent property enquiries across Dubai, Qatar,
                Mumbai, and Bangalore — with each organization&apos;s data kept separate.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center">
            <div>
              <h2 className="type-h2 max-w-xl">Turn missed opportunities into follow-ups.</h2>
              <p className="type-body mt-3 text-muted-foreground">
                Read how the product works, or start an agency workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="h-11 px-5" asChild>
                <Link href="/sign-up">Create your agency</Link>
              </Button>
              <Button variant="outline" className="h-11 px-5" asChild>
                <Link href="/company">Company</Link>
              </Button>
            </div>
          </div>
        </section>
      </article>
    </MarketingShell>
  );
}
