import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertStripeEventMode, getStripe, isEntitled } from "@/lib/stripe";
import { disableManagedDomainRenewal, provisionManagedDomain } from "@/lib/vercel-domains";
import { syncPartnerWholesaleBilling } from "@/lib/partner-billing";
import { catalogKindFromPrice, getPartnerCatalogPriceIds } from "@/lib/partner-stripe-catalog";

export const runtime = "nodejs";

async function completePartnerBillingSetup(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organization_id;
  const customerId = objectId(session.customer);
  const setupIntentId = objectId(session.setup_intent);
  if (!organizationId || !customerId || !setupIntentId) throw new Error("Partner billing setup metadata is incomplete.");
  const setupIntent = await getStripe().setupIntents.retrieve(setupIntentId);
  const paymentMethodId = objectId(setupIntent.payment_method);
  if (!paymentMethodId) throw new Error("Partner billing setup has no payment method.");
  await getStripe().customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });
  const { error } = await createAdminClient().from("partner_organizations").update({
    platform_stripe_customer_id: customerId,
    billing_payment_method_ready: true,
    billing_sync_error: null,
  }).eq("id", organizationId);
  if (error) throw error;
  await syncPartnerWholesaleBilling(organizationId);
}

async function recordPartnerWholesale(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata.organization_id;
  if (!organizationId) return false;
  const values: Record<string, unknown> = {
    platform_stripe_subscription_id: subscription.status === "canceled" ? null : subscription.id,
    platform_subscription_status: subscription.status,
    billing_synced_at: new Date().toISOString(),
  };
  const catalog = await getPartnerCatalogPriceIds();
  const priceColumns = { base: "platform_base_item_id", pro: "platform_pro_item_id", elite: "platform_elite_item_id", domain: "platform_domain_item_id" } as const;
  let hasWhiteLabelBase = false;
  for (const item of subscription.items.data) {
    const kind = catalogKindFromPrice(item.price, catalog);
    if (item.price.id === catalog.whiteLabelBase) hasWhiteLabelBase = true;
    const column = kind ? priceColumns[kind] : null;
    if (column) values[column] = item.id;
  }
  if (subscription.status === "canceled") {
    Object.assign(values, { platform_base_item_id: null, platform_pro_item_id: null, platform_elite_item_id: null, platform_domain_item_id: null });
  }
  if (hasWhiteLabelBase) {
    values.status = ["active", "trialing", "past_due"].includes(subscription.status) ? "active" : "suspended";
  }
  const { error } = await createAdminClient().from("partner_organizations").update(values).eq("id", organizationId);
  if (error) throw error;
  return true;
}

async function completePartnerWhiteLabelActivation(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organization_id;
  const subscriptionId = objectId(session.subscription);
  const customerId = objectId(session.customer);
  if (!organizationId || !subscriptionId || !customerId) throw new Error("White-label activation metadata is incomplete.");
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  if (!["active", "trialing", "past_due"].includes(subscription.status)) throw new Error("The white-label subscription is not active.");
  const { error } = await createAdminClient().from("partner_organizations").update({
    status: "active",
    platform_stripe_customer_id: customerId,
    platform_stripe_subscription_id: subscription.id,
    platform_subscription_status: subscription.status,
    billing_payment_method_ready: Boolean(subscription.default_payment_method),
    billing_sync_error: null,
  }).eq("id", organizationId);
  if (error) throw error;
  await recordPartnerWholesale(subscription);
}

function objectId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id || null;
}

async function reconcileCustomer(subscription: Stripe.Subscription, eventCreated: number, provisionDomain = false, eventId = "") {
  const customerId = objectId(subscription.customer);
  if (!customerId) throw new Error("Subscription " + subscription.id + " has no customer.");

  const subscriptions = await getStripe().subscriptions.list({ customer: customerId, status: "all", limit: 100 });
  const entitledSubscriptions = subscriptions.data.filter((item) => isEntitled(item.status));
  const userId = subscription.metadata.user_id
    || entitledSubscriptions.find((item) => item.metadata.user_id)?.metadata.user_id;
  if (!userId) throw new Error("Subscription " + subscription.id + " has no user_id metadata.");

  const priceIds = [...new Set(entitledSubscriptions.flatMap((item) => item.items.data.map((line) => line.price.id)))];
  const hasElite = priceIds.includes(process.env.STRIPE_ELITE_PRICE_ID || "");
  const hasPro = priceIds.includes(process.env.STRIPE_PRO_PRICE_ID || "");
  const hasCustomDomain = priceIds.includes(process.env.STRIPE_CUSTOM_DOMAIN_PRICE_ID || "");
  const tier = hasElite ? "elite" : hasPro ? "pro" : "free";
  const representative = entitledSubscriptions.find((item) => item.id === subscription.id)
    || entitledSubscriptions[0]
    || subscription;
  const firstItem = representative.items.data[0];
  const currentPeriodEnd = entitledSubscriptions
    .flatMap((item) => item.items.data.map((line) => line.current_period_end || 0))
    .reduce((latest, value) => Math.max(latest, value), 0);
  const domainSubscription = entitledSubscriptions.find((item) =>
    item.items.data.some((line) => line.price.id === process.env.STRIPE_CUSTOM_DOMAIN_PRICE_ID)
  );
  const status = entitledSubscriptions.find((item) => item.status === "past_due")?.status
    || entitledSubscriptions.find((item) => item.status === "trialing")?.status
    || entitledSubscriptions.find((item) => item.status === "active")?.status
    || subscription.status;

  const admin = createAdminClient();
  const { data: existingPlayer, error: existingPlayerError } = await admin
    .from("players")
    .select("custom_domain, custom_domain_status, custom_domain_order_id, custom_domain_purchase_price")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingPlayerError) throw existingPlayerError;
  if (!existingPlayer) throw new Error("No player portfolio exists for Stripe user " + userId + ".");
  const requestedDomain = domainSubscription?.metadata.requested_domain || subscription.metadata.requested_domain || null;
  if (hasCustomDomain && !requestedDomain) throw new Error("The custom-domain subscription has no requested_domain metadata.");
  const sameDomain = Boolean(requestedDomain && requestedDomain === existingPlayer?.custom_domain);

  const { data: updatedPlayer, error } = await admin.from("players").update({
    billing_tier: tier,
    subscription_status: status,
    stripe_customer_id: customerId,
    stripe_subscription_id: entitledSubscriptions.length ? representative.id : null,
    stripe_price_id: firstItem?.price.id || null,
    stripe_price_ids: priceIds,
    subscription_current_period_end: currentPeriodEnd
      ? new Date(currentPeriodEnd * 1000).toISOString()
      : null,
    subscription_cancel_at_period_end: entitledSubscriptions.some((item) => item.cancel_at_period_end),
    stripe_event_created_at: eventCreated,
    has_custom_domain: hasCustomDomain,
    custom_domain: hasCustomDomain ? requestedDomain : existingPlayer?.custom_domain || null,
    custom_domain_status: hasCustomDomain
      ? sameDomain && existingPlayer?.custom_domain_status === "active" ? "active" : "purchasing"
      : existingPlayer?.custom_domain ? "canceled" : "none",
    ...(hasCustomDomain && requestedDomain && !sameDomain ? {
      custom_domain_order_id: null,
      custom_domain_purchase_price: null,
      custom_domain_error: null,
    } : {}),
  }).eq("user_id", userId).lte("stripe_event_created_at", eventCreated).select("user_id").maybeSingle();
  if (error) throw error;
  if (!updatedPlayer) return;

  const alreadyActive = sameDomain && existingPlayer?.custom_domain_status === "active";
  if (hasCustomDomain && requestedDomain && !alreadyActive && provisionDomain) {
    let orderId = sameDomain ? existingPlayer?.custom_domain_order_id : null;
    if (!orderId) {
      const claimId = `initiating:${eventId || crypto.randomUUID()}`;
      const { data: claimed } = await admin.from("players").update({ custom_domain_order_id: claimId })
        .eq("user_id", userId)
        .eq("custom_domain", requestedDomain)
        .eq("custom_domain_status", "purchasing")
        .is("custom_domain_order_id", null)
        .select("user_id")
        .maybeSingle();
      if (!claimed) return;
      orderId = null;
    } else if (orderId.startsWith("initiating:")) {
      return;
    }
    try {
      const provisioned = await provisionManagedDomain(requestedDomain, orderId);
      const { error: domainError } = await admin.from("players").update({
        custom_domain_status: provisioned.status,
        custom_domain_order_id: provisioned.orderId,
        custom_domain_purchase_price: provisioned.purchasePrice ?? existingPlayer?.custom_domain_purchase_price ?? null,
        custom_domain_error: null,
      }).eq("user_id", userId).eq("custom_domain", requestedDomain);
      if (domainError) throw domainError;
    } catch (domainError) {
      const message = domainError instanceof Error ? domainError.message : "Domain provisioning failed.";
      await admin.from("players").update({
        custom_domain_status: "failed",
        custom_domain_error: message.slice(0, 1000),
      }).eq("user_id", userId).eq("custom_domain", requestedDomain);
      throw domainError;
    }
  } else if (!hasCustomDomain && existingPlayer?.custom_domain) {
    await disableManagedDomainRenewal(existingPlayer.custom_domain);
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  const signature = (await headers()).get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let event: Stripe.Event;
  try { event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret); }
  catch { return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 }); }

  try { assertStripeEventMode(event.livemode); }
  catch { return NextResponse.json({ error: "Webhook mode does not match this environment." }, { status: 400 }); }

  const admin = createAdminClient();
  const { data: existing } = await admin.from("stripe_webhook_events").select("status").eq("id", event.id).maybeSingle();
  if (existing?.status === "processed") return NextResponse.json({ received: true, duplicate: true });
  const { error: ledgerError } = await admin.from("stripe_webhook_events").upsert({ id: event.id, type: event.type, created: event.created, status: "processing", error: null });
  if (ledgerError) return NextResponse.json({ error: "Webhook event could not be recorded." }, { status: 500 });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.kind === "partner_billing_setup") {
        await completePartnerBillingSetup(session);
      } else if (session.metadata?.kind === "partner_white_label_activation") {
        await completePartnerWhiteLabelActivation(session);
      } else if (typeof session.subscription === "string") {
        const subscription = await getStripe().subscriptions.retrieve(session.subscription);
        if (!(await recordPartnerWholesale(subscription))) await reconcileCustomer(subscription, event.created, true, event.id);
      }
    }
    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      const subscription = event.data.object as Stripe.Subscription;
      if (!(await recordPartnerWholesale(subscription))) await reconcileCustomer(subscription, event.created);
    }
    const { error } = await admin.from("stripe_webhook_events").update({ status: "processed", processed_at: new Date().toISOString() }).eq("id", event.id);
    if (error) throw error;
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook failure";
    await admin.from("stripe_webhook_events").update({ status: "failed", error: message.slice(0, 1000) }).eq("id", event.id);
    console.error("Stripe webhook " + event.id + " failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
