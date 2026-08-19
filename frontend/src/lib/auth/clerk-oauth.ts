export function clerkOAuthUrls(origin: string, callbackPath: string, completePath: string) {
  const base = origin.replace(/\/$/, "");
  return {
    redirectCallbackUrl: `${base}${callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`}`,
    redirectUrl: `${base}${completePath.startsWith("/") ? completePath : `/${completePath}`}`,
  };
}

export function browserOAuthUrls(callbackPath: string, completePath: string) {
  return clerkOAuthUrls(window.location.origin, callbackPath, completePath);
}
