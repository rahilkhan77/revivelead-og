const USER_MESSAGES: Record<string, string> = {
  form_identifier_not_found: "Invalid email or password.",
  form_password_incorrect: "Invalid email or password.",
  form_identifier_exists: "An account with this email already exists.",
  form_password_pwned: "This password has appeared in a data breach. Choose a different one.",
  form_password_length_too_short: "Password is too short.",
  form_password_not_strong_enough: "Choose a stronger password.",
  form_code_incorrect: "That verification code is incorrect.",
  form_param_format_invalid: "Check that email and password are valid.",
  form_param_nil: "Please fill in all required fields.",
  verification_expired: "That verification code has expired. Request a new one.",
  verification_failed: "Verification required. Check your email and try again.",
  too_many_requests: "Too many attempts. Please wait a moment and try again.",
  session_exists: "You are already signed in.",
  identifier_already_signed_in: "You are already signed in.",
  strategy_for_user_invalid: "Invalid email or password.",
  oauth_access_denied: "Google sign-in was cancelled.",
  oauth_identities_missing: "Google could not complete sign-in. Try email instead.",
  oauth_provider_not_enabled: "Google sign-in is not available right now.",
};

function looksInternal(message: string) {
  return /clerk|fapi|undefined|internal|stack|request_id|pk_live|sk_live/i.test(message);
}

export function friendlyAuthMessage(code?: string | null, fallback?: string | null) {
  if (code && USER_MESSAGES[code]) return USER_MESSAGES[code];
  const text = fallback?.trim();
  if (text && !looksInternal(text)) return text;
  return "Something went wrong. Please try again.";
}

type ClerkFieldError = { code?: string; message?: string; longMessage?: string } | null;

export function clerkThrownMessage(error: unknown) {
  if (error && typeof error === "object") {
    const value = error as { code?: string; longMessage?: string; message?: string };
    return friendlyAuthMessage(value.code, value.longMessage ?? value.message);
  }
  if (error instanceof Error) return friendlyAuthMessage(undefined, error.message);
  return friendlyAuthMessage();
}

export function firstClerkMessage(errors?: unknown) {
  if (!errors || typeof errors !== "object") return null;
  const value = errors as {
    fields?: Record<string, ClerkFieldError>;
    global?: Array<{ code?: string; message?: string; longMessage?: string }> | null;
  };
  const field = value.fields
    ? Object.values(value.fields).find((item) => item?.code || item?.message)
    : null;
  if (field) return friendlyAuthMessage(field.code, field.longMessage ?? field.message);
  const global = value.global?.[0];
  if (global) return friendlyAuthMessage(global.code, global.longMessage ?? global.message);
  return null;
}
