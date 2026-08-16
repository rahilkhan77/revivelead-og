export function normalizePhone(phone?: string | null) {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return digits || null;
  return digits.slice(-10);
}

export function normalizeEmail(email?: string | null) {
  const value = email?.trim().toLowerCase() ?? "";
  return value || null;
}

export function phonesMatch(left?: string | null, right?: string | null) {
  const a = normalizePhone(left);
  const b = normalizePhone(right);
  return Boolean(a && b && a === b);
}
