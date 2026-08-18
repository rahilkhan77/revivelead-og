import { MarketingShell } from "@/components/marketing/marketing-shell";

export function LegalDocument({
  title,
  dated,
  intro,
  children,
}: {
  title: string;
  dated: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <MarketingShell>
      <article className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-3xl">
          <header className="border-b border-border pb-8">
            <p className="type-kicker">Legal</p>
            <h1 className="type-h1 mt-4 text-[2.15rem] sm:text-[2.6rem]">{title}</h1>
            <p className="type-small mt-3 text-muted-foreground">{dated}</p>
          </header>
          <p className="legal-doc-intro mt-8">{intro}</p>
          <div className="legal-doc">{children}</div>
        </div>
      </article>
    </MarketingShell>
  );
}
