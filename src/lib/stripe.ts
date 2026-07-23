import "server-only";
import Stripe from "stripe";

let stripe: Stripe | undefined;

export type StripeMode = "test" | "live";

export function getStripeMode(): StripeMode {
  const mode = process.env.STRIPE_MODE;
  if (mode !== "test" && mode !== "live") {
    throw new Error("STRIPE_MODE must be set to either test or live.");
  }

  const isVercelProduction = process.env.VERCEL_ENV === "production";
  if (isVercelProduction && mode !== "live") {
    throw new Error("Vercel production must use STRIPE_MODE=live.");
  }
  if (!isVercelProduction && mode !== "test") {
    throw new Error("Live Stripe credentials are forbidden outside Vercel production.");
  }

  return mode;
}

export function getStripe() {
  const mode = getStripeMode();
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");

  const validPrefixes = mode === "live" ? ["sk_live_"] : ["sk_test_", "rk_test_"];
  if (!validPrefixes.some((prefix) => secretKey.startsWith(prefix))) {
    throw new Error("STRIPE_SECRET_KEY does not match STRIPE_MODE=" + mode + ".");
  }

  stripe ??= new Stripe(secretKey);
  return stripe;
}

export function getAppUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!configuredUrl) throw new Error("NEXT_PUBLIC_APP_URL is not configured.");

  const url = new URL(configuredUrl);
  if (getStripeMode() === "live") {
    if (url.protocol !== "https:") throw new Error("The production app URL must use HTTPS.");
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      throw new Error("The production app URL cannot point to localhost.");
    }
  }

  return url.origin;
}

export function assertStripeEventMode(livemode: boolean) {
  const expectedLiveMode = getStripeMode() === "live";
  if (livemode !== expectedLiveMode) {
    throw new Error(
      `Rejected a ${livemode ? "live" : "test"} Stripe event while configured for ${expectedLiveMode ? "live" : "test"} mode.`,
    );
  }
}

export function isEntitled(status: Stripe.Subscription.Status) {
  return status === "active" || status === "trialing" || status === "past_due";
}
