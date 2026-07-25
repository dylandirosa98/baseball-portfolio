export const PROFILE_DOMAIN = "diamondprofile.app";

const reservedSlugs = new Set([
  "account", "admin", "api", "app", "assets", "auth", "autoconfig", "autodiscover",
  "billing", "blog", "builder", "cdn", "dashboard", "email", "favicon", "ftp", "help",
  "icon", "imap", "login", "mail", "mx", "pop", "pricing", "robots", "signup", "smtp",
  "static", "status", "support", "sitemap", "webmail", "www",
]);

export function sanitizeProfileSlugInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-/, "")
    .slice(0, 60);
}

export function normalizeProfileSlug(value: string) {
  return sanitizeProfileSlugInput(value.trim()).replace(/-$/, "");
}

export function profileSlugError(slug: string) {
  if (slug.length < 3) return "Use at least 3 letters, numbers, or hyphens.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "A profile address cannot begin or end with a hyphen.";
  if (reservedSlugs.has(slug)) return "That address is reserved. Choose another.";
  return null;
}

export function profileHostname(slug: string) {
  return `${normalizeProfileSlug(slug)}.${PROFILE_DOMAIN}`;
}

export function profileUrl(slug: string) {
  return `https://${profileHostname(slug)}`;
}
