import { db } from "@/lib/db";

export type PropertySearchInput = {
  organizationId: string;
  location?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  budgetMax?: number | null;
  currency?: string | null;
  buyOrRent?: string | null;
};

export async function searchProperties(input: PropertySearchInput) {
  const location = input.location?.trim();
  return db.property.findMany({
    where: {
      organizationId: input.organizationId,
      status: "AVAILABLE",
      ...(location
        ? {
            OR: [
              { location: { contains: location } },
              { city: { contains: location } },
            ],
          }
        : {}),
      ...(input.propertyType ? { type: { contains: input.propertyType } } : {}),
      ...(input.bedrooms ? { bedrooms: input.bedrooms } : {}),
      ...(input.budgetMax ? { price: { lte: input.budgetMax } } : {}),
      ...(input.currency ? { currency: input.currency } : {}),
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });
}

export type PropertyImportRow = {
  title: string;
  location: string;
  type: string;
  price?: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  country?: string;
  description?: string;
  imageUrl?: string;
  externalUrl?: string;
  agentName?: string;
};
