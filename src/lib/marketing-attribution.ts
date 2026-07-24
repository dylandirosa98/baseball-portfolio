export const MARKETING_ATTRIBUTION_KEY = "diamond_marketing_attribution_v1";

const attributionKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;

export type MarketingAttribution = Partial<Record<(typeof attributionKeys)[number], string>> & {
  landing_page?: string;
  captured_at?: string;
};

type MetaPixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
  }
}

export function captureMarketingAttribution(search: string) {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(search);
  const incoming: MarketingAttribution = {};
  for (const key of attributionKeys) {
    const value = params.get(key)?.trim().slice(0, 200);
    if (value) incoming[key] = value;
  }
  if (Object.keys(incoming).length === 0) return getMarketingAttribution();

  const attribution: MarketingAttribution = {
    ...getMarketingAttribution(),
    ...incoming,
    landing_page: window.location.pathname + window.location.search,
    captured_at: new Date().toISOString(),
  };
  localStorage.setItem(MARKETING_ATTRIBUTION_KEY, JSON.stringify(attribution));
  return attribution;
}

export function getMarketingAttribution(): MarketingAttribution {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(localStorage.getItem(MARKETING_ATTRIBUTION_KEY) || "{}") as unknown;
    return value && typeof value === "object" ? value as MarketingAttribution : {};
  } catch {
    return {};
  }
}

export function trackMetaEvent(name: string, parameters: Record<string, unknown> = {}, custom = false) {
  if (typeof window === "undefined" || !window.fbq) return;
  const attribution = getMarketingAttribution();
  window.fbq(custom ? "trackCustom" : "track", name, { ...attribution, ...parameters });
}

export function trackMetaEventOnce(storageKey: string, name: string, parameters: Record<string, unknown> = {}, custom = false, attempt = 0) {
  if (typeof window === "undefined") return;
  if (!window.fbq) {
    if (attempt < 10) window.setTimeout(() => trackMetaEventOnce(storageKey, name, parameters, custom, attempt + 1), 500);
    return;
  }
  const key = "diamond_meta_event:" + storageKey;
  if (localStorage.getItem(key)) return;
  trackMetaEvent(name, parameters, custom);
  localStorage.setItem(key, new Date().toISOString());
}
