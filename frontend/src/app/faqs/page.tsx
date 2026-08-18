import Link from "next/link";
import { FaqList } from "@/components/marketing/faq-list";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { marketingMetadata } from "@/lib/marketing/seo";

export const metadata = marketingMetadata(
  "FAQs",
  "Answers about ReviveLead, lead recovery, AI, imports, data, billing, cancellation, and support.",
  "/faqs",
);

const faqs = [
  {
    q: "What is ReviveLead?",
    a: "ReviveLead is a revenue-recovery platform for real-estate agencies. It captures enquiries, keeps follow-ups on time, and reactivates dormant pipeline so paid leads do not expire in a chat thread.",
  },
  {
    q: "Who is it for?",
    a: "It is built for international B2B real-estate agencies and businesses. The product language, demo data, and markets are Dubai, Qatar, Mumbai, and Bangalore.",
  },
  {
    q: "Is ReviveLead for real-estate agencies?",
    a: "Yes. The workspace is designed around property leads, agency teams, follow-up sequences, and recovered revenue — not a generic consumer CRM.",
  },
  {
    q: "What does lead recovery mean?",
    a: "Lead recovery is contacting inactive or forgotten enquiries and tracking deals that come back from that work. Recovered revenue is recorded from won deals after reactivation, and is not mixed with ordinary closings.",
  },
  {
    q: "How does AI help?",
    a: "ReviveLead can score leads for budget, area, intent, and urgency, and suggest a next action. It may also assist follow-up and related workflows. AI output can contain errors. Customers remain responsible for reviewing it before relying on or sending it.",
  },
  {
    q: "Can I import leads?",
    a: "Yes. You can upload an existing lead database from the Import Center, preview and map columns, then import into the same pipeline. Leads can also arrive from the website widget, ingest APIs, and n8n webhooks.",
  },
  {
    q: "Do we need WhatsApp credentials on day one?",
    a: "No. Demo mode records outbound messages and can simulate inbound replies. Connect the WhatsApp Cloud API when you are ready.",
  },
  {
    q: "Can each agency keep data separate?",
    a: "Yes. Every record is scoped to an organization. Users never query another company's leads.",
  },
  {
    q: "What happens to my data?",
    a: "You retain ownership of the leads, contacts, notes, files, messages, and other content you submit. ReviveLead processes that information to provide the service. Details are in the Privacy Policy.",
  },
  {
    q: "Is my data shared or sold?",
    a: "ReviveLead does not sell customer lead databases as a product. Third-party providers used for authentication, hosting, payments, email, analytics, security, or AI may process information necessary to perform their services.",
  },
  {
    q: "How does billing work?",
    a: "Plans, seats, and lead limits are enforced. Applicable pricing, billing frequency, usage limits, taxes, and payment terms are presented at purchase. Paid subscriptions may be processed through Razorpay or other payment providers used by ReviveLead.",
  },
  {
    q: "Monthly vs annual plans",
    a: "ReviveLead may offer monthly and annual subscriptions. The billing frequency that applies to your account is the one shown at purchase. Published plan cards currently list monthly prices.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. Customers may cancel subscriptions at any time.",
  },
  {
    q: "Are subscriptions refundable?",
    a: "Monthly subscription charges are non-refundable except where required by applicable law or expressly stated otherwise. For annual subscriptions, cancellation does not provide a refund of the remaining paid period.",
  },
  {
    q: "What happens after cancellation?",
    a: "An annual subscription remains active through the end of the period already paid for. After cancellation or termination, customer data may be retained for a defined operational retention period before deletion, subject to applicable law, backups, and legal requirements.",
  },
  {
    q: "How do I contact support?",
    a: "Email support@revivelead.io for general, account, billing, or technical support.",
  },
  {
    q: "How do I make privacy or data requests?",
    a: "Email privacy@revivelead.io. Depending on your jurisdiction you may have rights including access, correction, deletion, restriction, objection, and portability where applicable. We may need to verify your identity before processing a request.",
  },
];

export default function FaqsPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-3xl">
          <p className="type-kicker">FAQs</p>
          <h1 className="type-h1 mt-4 text-[2.15rem] sm:text-[2.6rem]">Questions</h1>
          <p className="type-body mt-5 max-w-xl text-muted-foreground">
            Short answers about the product, data, and billing. Legal detail lives in the{" "}
            <Link href="/privacy-policy" className="underline underline-offset-4">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="underline underline-offset-4">
              Terms & Conditions
            </Link>
            .
          </p>
          <div className="mt-10">
            <FaqList items={faqs} />
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
