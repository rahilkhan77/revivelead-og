export const COUNTRIES = ["UAE", "Qatar", "India"] as const;
export type Country = (typeof COUNTRIES)[number];

export const CURRENCIES = ["AED", "QAR", "INR", "USD"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const COUNTRY_DEFAULTS: Record<
  Country,
  { currency: CurrencyCode; timezone: string; markets: string[] }
> = {
  UAE: { currency: "AED", timezone: "Asia/Dubai", markets: ["Dubai"] },
  Qatar: { currency: "QAR", timezone: "Asia/Qatar", markets: ["Qatar"] },
  India: { currency: "INR", timezone: "Asia/Kolkata", markets: ["Mumbai", "Bangalore"] },
};

export const MARKET_DEFAULTS: Record<
  string,
  { country: Country; currency: CurrencyCode; timezone: string }
> = {
  Dubai: { country: "UAE", currency: "AED", timezone: "Asia/Dubai" },
  Qatar: { country: "Qatar", currency: "QAR", timezone: "Asia/Qatar" },
  Mumbai: { country: "India", currency: "INR", timezone: "Asia/Kolkata" },
  Bangalore: { country: "India", currency: "INR", timezone: "Asia/Kolkata" },
};

export function defaultsForMarket(market: string) {
  return MARKET_DEFAULTS[market] ?? MARKET_DEFAULTS.Dubai;
}

export function defaultsForCountry(country: string) {
  return COUNTRY_DEFAULTS[(country as Country) in COUNTRY_DEFAULTS ? (country as Country) : "UAE"];
}
