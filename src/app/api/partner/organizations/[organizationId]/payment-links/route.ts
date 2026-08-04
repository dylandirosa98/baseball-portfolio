import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { partnerAccess } from "@/lib/partners";
import { partnerPlatformCostCents } from "@/lib/partner-billing";

export async function POST(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const access = await partnerAccess(user.id, organizationId, ["owner", "admin"]);
  if (!access) return NextResponse.json({ error: "Partner administrator access is required." }, { status: 403 });
  if (!access.organization.stripe_account_id || access.organization.stripe_account_status !== "active") {
    return NextResponse.json({ error: "Connect an active Stripe account before adding Payment Links." }, { status: 409 });
  }
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const url = String(body.url || "").trim();
  const name = String(body.name || "").trim().slice(0, 100);
  const tier = body.tier === "elite" ? "elite" : body.tier === "pro" ? "pro" : null;
  const createNew = body.create === true;
  const requestedCents = Number(body.priceCents);
  const platformCost = tier ? partnerPlatformCostCents(access.organization, tier) : 0;
  if (!name || !tier || (!createNew && !/^https:\/\/(?:buy|checkout)\.stripe\.com\//.test(url))) {
    return NextResponse.json({ error: createNew ? "Add a name, tier, and retail monthly price." : "Add a name, Pro or Elite tier, and a valid Stripe Payment Link." }, { status: 400 });
  }
  if (createNew && (!Number.isInteger(requestedCents) || requestedCents < platformCost)) {
    return NextResponse.json({ error: `The retail price must be at least $${(platformCost / 100).toFixed(2)} per month so the platform base is covered.` }, { status: 400 });
  }

  const stripe = getStripe();
  const options = { stripeAccount: access.organization.stripe_account_id };
  let match: Stripe.PaymentLink | null = null;
  if (createNew) {
    const product = await stripe.products.create({
      name,
      metadata: { managed_by: "diamond_profile", organization_id: organizationId, tier },
    }, options);
    const price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: requestedCents,
      recurring: { interval: "month" },
      metadata: { managed_by: "diamond_profile", organization_id: organizationId, tier },
    }, options);
    match = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { managed_by: "diamond_profile", organization_id: organizationId, tier },
    }, options);
  } else {
    let startingAfter: string | undefined;
    for (let page = 0; page < 10 && !match; page += 1) {
      const links = await stripe.paymentLinks.list({ active: true, limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) }, options);
      match = links.data.find((link) => link.url === url) || null;
      if (!links.has_more || links.data.length === 0) break;
      startingAfter = links.data.at(-1)?.id;
    }
  }
  if (!match) return NextResponse.json({ error: "That link was not found in the connected Stripe account." }, { status: 404 });
  const lines = await stripe.paymentLinks.listLineItems(match.id, { limit: 100 }, options);
  if (lines.data.length !== 1 || !lines.data[0].price?.recurring) {
    return NextResponse.json({ error: "Use a Payment Link containing one recurring subscription price." }, { status: 400 });
  }
  const price = lines.data[0].price;
  if (!price.unit_amount || price.unit_amount < platformCost) {
    return NextResponse.json({ error: `That checkout price must be at least $${(platformCost / 100).toFixed(2)} per month. The difference above the platform base is your margin.` }, { status: 400 });
  }
  const { data, error } = await createAdminClient().from("partner_payment_links").upsert({
    organization_id: organizationId,
    name,
    tier,
    stripe_payment_link_id: match.id,
    stripe_price_id: price.id,
    url: match.url,
    currency: price.currency,
    unit_amount: price.unit_amount,
    recurring_interval: price.recurring?.interval,
    platform_cost_cents: platformCost,
    partner_margin_cents: Math.max(0, price.unit_amount - platformCost),
    active: match.active,
    verified_at: new Date().toISOString(),
    created_by: user.id,
  }, { onConflict: "organization_id,stripe_payment_link_id" }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ paymentLink: data });
}

export async function DELETE(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await partnerAccess(user.id, organizationId, ["owner", "admin"]))) {
    return NextResponse.json({ error: "Partner administrator access is required." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({})) as { id?: string };
  const { error } = await createAdminClient().from("partner_payment_links").update({ active: false })
    .eq("id", body.id || "").eq("organization_id", organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ disabled: true });
}

export async function PATCH(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const access = await partnerAccess(user.id, organizationId, ["owner", "admin"]);
  if (!access || !access.organization.stripe_account_id || access.organization.stripe_account_status !== "active") {
    return NextResponse.json({ error: "An active connected Stripe account is required." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const linkId = String(body.id || "");
  const cents = Number(body.priceCents);
  if (!linkId || !Number.isInteger(cents) || cents <= 0) return NextResponse.json({ error: "Enter a valid monthly price." }, { status: 400 });
  const existing = await createAdminClient().from("partner_payment_links").select("*").eq("id", linkId).eq("organization_id", organizationId).eq("active", true).maybeSingle();
  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });
  if (!existing.data) return NextResponse.json({ error: "Payment Link was not found." }, { status: 404 });
  const platformCost = partnerPlatformCostCents(access.organization, existing.data.tier);
  if (cents < platformCost) return NextResponse.json({ error: `The retail price must be at least $${(platformCost / 100).toFixed(2)} per month.` }, { status: 400 });

  try {
    const stripe = getStripe();
    const options = { stripeAccount: access.organization.stripe_account_id };
    const oldPrice = await stripe.prices.retrieve(existing.data.stripe_price_id, {}, options);
    const productId = typeof oldPrice.product === "string" ? oldPrice.product : oldPrice.product?.id;
    if (!productId || !oldPrice.recurring) throw new Error("The existing Stripe price is no longer available.");
    const supportedIntervals = ["day", "week", "month", "year"] as const;
    const interval = supportedIntervals.find((value) => value === String(oldPrice.recurring?.interval));
    if (!interval) throw new Error("The existing Stripe recurring interval is not supported.");
    const newPrice = await stripe.prices.create({
      product: productId,
      currency: oldPrice.currency,
      unit_amount: cents,
      recurring: { interval, interval_count: oldPrice.recurring.interval_count || 1 },
      metadata: { managed_by: "diamond_profile", organization_id: organizationId, tier: existing.data.tier },
    }, options);
    const newLink = await stripe.paymentLinks.create({
      line_items: [{ price: newPrice.id, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { managed_by: "diamond_profile", organization_id: organizationId, tier: existing.data.tier },
    }, options);
    const admin = createAdminClient();
    const inserted = await admin.from("partner_payment_links").insert({
      organization_id: organizationId,
      name: existing.data.name,
      tier: existing.data.tier,
      stripe_payment_link_id: newLink.id,
      stripe_price_id: newPrice.id,
      url: newLink.url,
      currency: newPrice.currency,
      unit_amount: newPrice.unit_amount,
      recurring_interval: newPrice.recurring?.interval,
      platform_cost_cents: platformCost,
      partner_margin_cents: cents - platformCost,
      active: true,
      verified_at: new Date().toISOString(),
      created_by: user.id,
    }).select("*").single();
    if (inserted.error) throw inserted.error;
    const disabled = await admin.from("partner_payment_links").update({ active: false }).eq("id", linkId);
    if (disabled.error) throw disabled.error;
    const checkoutUpdate = await admin.from("partner_profile_checkouts").update({ payment_link_id: inserted.data.id }).eq("payment_link_id", linkId);
    if (checkoutUpdate.error) throw checkoutUpdate.error;
    return NextResponse.json({ paymentLink: inserted.data, previousLinkId: linkId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment Link price could not be updated." }, { status: 502 });
  }
}
