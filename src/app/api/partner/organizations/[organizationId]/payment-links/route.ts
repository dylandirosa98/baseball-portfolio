import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { partnerAccess } from "@/lib/partners";
import { partnerPlatformCostCents } from "@/lib/partner-billing";
import { createManagedPartnerPrice, stripeProductId } from "@/lib/partner-pricing";

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
  if (createNew && (!Number.isInteger(requestedCents) || requestedCents < 0 || requestedCents > 1_000_000)) {
    return NextResponse.json({ error: "Enter a monthly price between $0 and $10,000." }, { status: 400 });
  }

  const stripe = getStripe();
  const options = { stripeAccount: access.organization.stripe_account_id };
  let match: Stripe.PaymentLink | null = null;
  if (createNew) {
    const active = await createAdminClient().from("partner_payment_links").select("id").eq("organization_id", organizationId).eq("tier", tier).eq("pricing_scope", "catalog").eq("active", true).maybeSingle();
    if (active.error) return NextResponse.json({ error: active.error.message }, { status: 500 });
    if (active.data) return NextResponse.json({ error: `Use Price Management to update the existing ${tier} price.` }, { status: 409 });
    try {
      const created = await createManagedPartnerPrice({
        organization: access.organization,
        tier,
        priceCents: requestedCents,
        name,
        createdBy: user.id,
        scope: "catalog",
        idempotencySeed: `partner_catalog_${organizationId}_${tier}_${requestedCents}_${crypto.randomUUID()}`,
      });
      return NextResponse.json({ paymentLink: created.paymentLink });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Stripe pricing could not be created." }, { status: 502 });
    }
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
  if (price.unit_amount == null || price.unit_amount < 0) {
    return NextResponse.json({ error: "That checkout does not contain a valid recurring price." }, { status: 400 });
  }
  const admin = createAdminClient();
  const previous = await admin.from("partner_payment_links").select("id,stripe_payment_link_id").eq("organization_id", organizationId).eq("tier", tier).eq("pricing_scope", "catalog").eq("active", true).neq("stripe_payment_link_id", match.id);
  if (previous.error) return NextResponse.json({ error: previous.error.message }, { status: 500 });
  if (previous.data.length) {
    const disabled = await admin.from("partner_payment_links").update({ active: false }).in("id", previous.data.map((item) => item.id));
    if (disabled.error) return NextResponse.json({ error: disabled.error.message }, { status: 500 });
  }
  const { data, error } = await admin.from("partner_payment_links").upsert({
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
    pricing_scope: "catalog",
    player_id: null,
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
  if (!linkId || !Number.isInteger(cents) || cents < 0 || cents > 1_000_000) return NextResponse.json({ error: "Enter a monthly price between $0 and $10,000." }, { status: 400 });
  const existing = await createAdminClient().from("partner_payment_links").select("*").eq("id", linkId).eq("organization_id", organizationId).eq("active", true).maybeSingle();
  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 500 });
  if (!existing.data) return NextResponse.json({ error: "Payment Link was not found." }, { status: 404 });
  if (existing.data.pricing_scope !== "catalog") return NextResponse.json({ error: "Only organization catalog prices can be changed here." }, { status: 400 });
  if (existing.data.unit_amount === cents) return NextResponse.json({ paymentLink: existing.data, unchanged: true, migratedSubscriptions: 0 });

  try {
    const stripe = getStripe();
    const options = { stripeAccount: access.organization.stripe_account_id };
    const oldPrice = await stripe.prices.retrieve(existing.data.stripe_price_id, {}, options);
    const productId = stripeProductId(oldPrice);
    if (!productId || !oldPrice.recurring) throw new Error("The existing Stripe price is no longer available.");
    if (oldPrice.recurring.interval !== "month") throw new Error("The existing Stripe price is not monthly.");
    const admin = createAdminClient();
    const oldLinks = await admin.from("partner_payment_links").select("id,stripe_payment_link_id").eq("organization_id", organizationId).eq("tier", existing.data.tier).eq("pricing_scope", "catalog").eq("active", true);
    if (oldLinks.error) throw oldLinks.error;
    const oldLinkIds = oldLinks.data.map((item) => item.id);
    const disabled = await admin.from("partner_payment_links").update({ active: false }).in("id", oldLinkIds);
    if (disabled.error) throw disabled.error;
    let created;
    try {
      created = await createManagedPartnerPrice({
        organization: access.organization,
        tier: existing.data.tier,
        priceCents: cents,
        name: existing.data.name,
        createdBy: user.id,
        scope: "catalog",
        productId,
        idempotencySeed: `partner_catalog_update_${organizationId}_${existing.data.tier}_${linkId}_${cents}`,
      });
    } catch (error) {
      await admin.from("partner_payment_links").update({ active: true }).eq("id", linkId);
      throw error;
    }
    const inserted = created.paymentLink;
    const checkoutUpdate = await admin.from("partner_profile_checkouts").update({ payment_link_id: inserted.id }).in("payment_link_id", oldLinkIds);
    if (checkoutUpdate.error) throw checkoutUpdate.error;
    let migratedSubscriptions = 0;
    const migrationErrors: string[] = [];
    if (body.migrateExisting === true) {
      const subscriptions = await admin.from("partner_customer_subscriptions").select("id,player_id,stripe_subscription_id").in("payment_link_id", oldLinkIds).in("status", ["trialing", "active", "past_due", "canceling"]);
      if (subscriptions.error) throw subscriptions.error;
      for (const mapped of subscriptions.data) {
        try {
          const subscription = await stripe.subscriptions.retrieve(mapped.stripe_subscription_id, {}, options);
          const item = subscription.items.data[0];
          if (!item) throw new Error("Subscription item was not found.");
          await stripe.subscriptions.update(subscription.id, {
            items: [{ id: item.id, price: inserted.stripe_price_id }],
            // The new amount begins on the next renewal; no surprise mid-cycle invoice.
            proration_behavior: "none",
          }, options);
          await admin.from("partner_customer_subscriptions").update({ payment_link_id: inserted.id }).eq("id", mapped.id);
          await admin.from("players").update({ partner_payment_link_id: inserted.id }).eq("id", mapped.player_id);
          migratedSubscriptions += 1;
        } catch (error) {
          migrationErrors.push(error instanceof Error ? error.message : `Could not update ${mapped.stripe_subscription_id}.`);
        }
      }
    }
    await Promise.allSettled(oldLinks.data.map((link) => stripe.paymentLinks.update(link.stripe_payment_link_id, { active: false }, options)));
    return NextResponse.json({ paymentLink: inserted, previousLinkId: linkId, migratedSubscriptions, migrationErrors });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment Link price could not be updated." }, { status: 502 });
  }
}
