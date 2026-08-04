import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { partnerPlatformCostCents } from "@/lib/partner-billing";
import type { PartnerOrganizationRow } from "@/lib/partners";

export type PartnerRetailTier = "pro" | "elite";
export type PartnerPricingScope = "catalog" | "athlete";

export const DEFAULT_PARTNER_RETAIL_CENTS: Record<PartnerRetailTier, number> = {
  pro: 1500,
  elite: 2500,
};

type ManagedPriceInput = {
  organization: PartnerOrganizationRow;
  tier: PartnerRetailTier;
  priceCents: number;
  name: string;
  createdBy?: string | null;
  scope?: PartnerPricingScope;
  playerId?: string | null;
  productId?: string | null;
  idempotencySeed: string;
};

/**
 * Stripe Price amounts are immutable. Every price change therefore creates a
 * replacement Price and Payment Link on the connected account, then stores the
 * new mapping used by Diamond Profile checkout sessions.
 */
export async function createManagedPartnerPrice(input: ManagedPriceInput) {
  const accountId = input.organization.stripe_account_id;
  if (!accountId || input.organization.stripe_account_status !== "active") {
    throw new Error("An active connected Stripe account is required before pricing can be created.");
  }
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0 || input.priceCents > 1_000_000) {
    throw new Error("Retail price must be between $0 and $10,000 per month.");
  }

  const stripe = getStripe();
  const baseOptions = { stripeAccount: accountId };
  let productId = input.productId || null;
  if (!productId) {
    const product = await stripe.products.create({
      name: input.name,
      metadata: {
        managed_by: "diamond_profile",
        organization_id: input.organization.id,
        tier: input.tier,
        pricing_scope: input.scope || "catalog",
        ...(input.playerId ? { player_id: input.playerId } : {}),
      },
    }, { ...baseOptions, idempotencyKey: `${input.idempotencySeed}_product` });
    productId = product.id;
  }

  const price = await stripe.prices.create({
    product: productId,
    currency: "usd",
    unit_amount: input.priceCents,
    recurring: { interval: "month" },
    metadata: {
      managed_by: "diamond_profile",
      organization_id: input.organization.id,
      tier: input.tier,
      pricing_scope: input.scope || "catalog",
      ...(input.playerId ? { player_id: input.playerId } : {}),
    },
  }, { ...baseOptions, idempotencyKey: `${input.idempotencySeed}_price` });

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    allow_promotion_codes: input.priceCents > 0,
    metadata: {
      managed_by: "diamond_profile",
      organization_id: input.organization.id,
      tier: input.tier,
      pricing_scope: input.scope || "catalog",
      ...(input.playerId ? { player_id: input.playerId } : {}),
    },
  }, { ...baseOptions, idempotencyKey: `${input.idempotencySeed}_link` });

  const platformCost = partnerPlatformCostCents(input.organization, input.tier);
  const inserted = await createAdminClient().from("partner_payment_links").upsert({
    organization_id: input.organization.id,
    name: input.name,
    tier: input.tier,
    stripe_payment_link_id: paymentLink.id,
    stripe_price_id: price.id,
    url: paymentLink.url,
    currency: price.currency,
    unit_amount: price.unit_amount,
    recurring_interval: price.recurring?.interval,
    platform_cost_cents: platformCost,
    // A custom price can be below wholesale. The organization covers the gap.
    partner_margin_cents: Math.max(0, input.priceCents - platformCost),
    pricing_scope: input.scope || "catalog",
    player_id: input.playerId || null,
    active: true,
    verified_at: new Date().toISOString(),
    created_by: input.createdBy || null,
  }, { onConflict: "organization_id,stripe_payment_link_id" }).select("*").single();
  if (inserted.error) throw inserted.error;
  return { paymentLink: inserted.data, stripePaymentLink: paymentLink, price };
}

/** Provision the familiar $15 Pro and $25 Elite catalog after Connect setup. */
export async function ensurePartnerDefaultPricing(organization: PartnerOrganizationRow) {
  if (!organization.stripe_account_id || organization.stripe_account_status !== "active") return [];
  const admin = createAdminClient();
  const existing = await admin.from("partner_payment_links")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("pricing_scope", "catalog")
    .eq("active", true);
  if (existing.error) throw existing.error;

  const created = [];
  for (const tier of ["pro", "elite"] as const) {
    if (existing.data.some((link) => link.tier === tier)) continue;
    created.push(await createManagedPartnerPrice({
      organization,
      tier,
      priceCents: DEFAULT_PARTNER_RETAIL_CENTS[tier],
      name: `${organization.name} ${tier === "pro" ? "Pro" : "Elite"}`,
      scope: "catalog",
      idempotencySeed: `diamond_partner_catalog_${organization.id}_${tier}_v1`,
    }));
  }
  return created;
}

export function stripeProductId(price: Stripe.Price) {
  return typeof price.product === "string" ? price.product : price.product?.id || null;
}
