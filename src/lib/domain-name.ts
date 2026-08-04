export function normalizeManagedDomain(value: string) {
  const domain = value.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  return domain && !domain.includes(".") ? domain + ".com" : domain;
}

export function isStandardComDomain(value: string) {
  if (!/^[a-z0-9-]+\.com$/.test(value)) return false;
  const label = value.slice(0, -4);
  return label.length > 0 && label.length <= 63 && !label.startsWith("-") && !label.endsWith("-");
}

/** Normalize an apex domain supplied by a white-label partner. */
export function normalizePartnerDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split(/[/?#]/)[0]
    .replace(/\.$/, "");
}

/** Partner domains are connected, not purchased by this checkout flow. */
export function isValidPartnerDomain(value: string) {
  if (!value || value.length > 253 || value.includes("..") || value.startsWith(".") || value.endsWith(".")) return false;
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(value)) return false;
  return !value.startsWith("www.") && !value.endsWith(".diamondprofile.app");
}

export function partnerBuilderHostname(domain: string) {
  return `build.${normalizePartnerDomain(domain)}`;
}

export function partnerPlayerHostname(slug: string, domain: string) {
  return `${slug}.${normalizePartnerDomain(domain)}`;
}
