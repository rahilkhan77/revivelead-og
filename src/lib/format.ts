import { formatDistanceToNow, format } from "date-fns";

export function formatMoney(amount: number | null | undefined, currency = "AED") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatBudget(
  min?: number | null,
  max?: number | null,
  currency = "AED",
) {
  if (!min && !max) return "—";
  if (min && max) return `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
  return formatMoney(min ?? max, currency);
}

export function formatRelative(date?: Date | string | null) {
  if (!date) return "Never";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDateTime(date?: Date | string | null) {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

export function formatDate(date?: Date | string | null) {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy");
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
