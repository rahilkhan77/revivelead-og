import { ChevronDown } from "lucide-react";

export type FaqItem = { q: string; a: string };

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((item) => (
        <details key={item.q} className="faq-item group py-5">
          <summary className="flex cursor-pointer items-start justify-between gap-4 rounded-sm text-left focus-visible:outline-none">
            <h2 className="type-h3 pr-2">{item.q}</h2>
            <ChevronDown
              data-chevron
              className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="type-small mt-3 max-w-2xl text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
