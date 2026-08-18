import { isClerkEnabled } from "@/lib/auth/clerk";

export function signInPath() {
  return isClerkEnabled() ? "/sign-in" : "/login";
}

export function signUpPath() {
  return isClerkEnabled() ? "/sign-up" : "/signup";
}
