export const CANONICAL_FIELDS = [
  "name",
  "phone",
  "email",
  "source",
  "propertyType",
  "location",
  "budget",
  "currency",
  "buyOrRent",
  "timeline",
  "notes",
  "bedrooms",
] as const;

export type CanonicalField = (typeof CANONICAL_FIELDS)[number];
export type ColumnMapping = Partial<Record<CanonicalField, string>>;

const ALIASES: Record<CanonicalField, string[]> = {
  name: ["name", "fullname", "full_name", "client", "customer", "leadname", "contactname"],
  phone: ["phone", "mobile", "mobilenumber", "contact", "phonenumber", "whatsapp", "cell", "telephone"],
  email: ["email", "emailaddress", "mail"],
  source: ["source", "origin", "channel", "portal"],
  propertyType: ["propertytype", "type", "unittype", "category"],
  location: ["location", "area", "interestedarea", "preferredlocation", "community", "city"],
  budget: ["budget", "pricerange", "maxbudget", "price", "budgetmax"],
  currency: ["currency", "ccy"],
  buyOrRent: ["buyorrent", "intent", "purpose", "enquirytype"],
  timeline: ["timeline", "when", "movein"],
  notes: ["notes", "comment", "remarks", "message"],
  bedrooms: ["bedrooms", "beds", "bhk", "br"],
};

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();
  for (const field of CANONICAL_FIELDS) {
    const match = headers.find((header) => {
      const normalized = normalizeHeader(header);
      return !used.has(header) && ALIASES[field].includes(normalized);
    });
    if (match) {
      mapping[field] = match;
      used.add(match);
    }
  }
  return mapping;
}

export function applyMapping(row: Record<string, string>, mapping: ColumnMapping) {
  const out: Record<string, string> = {};
  for (const field of CANONICAL_FIELDS) {
    const header = mapping[field];
    if (!header) continue;
    out[field] = row[header] ?? "";
  }
  return out;
}
