import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertStripeEventMode, getStripe, isEntitled } from "@/lib/stripe";
import { disableManagedDomainRenewal, provisionManagedDomain } from "@/lib/vercel-domains";

export const runtime = "nodejs";

function objectId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id || null;
}

async function reconcileCustomer(subscription: Stripe.Subscription, eventCreated: number) {
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
  const { data: existingPlayer } = await admin
    .from("players")
    .select("custom_domain, custom_domain_status")
    .eq("user_id", userId)
    .maybeSingle();
  const requestedDomain = domainSubscription?.metadata.requested_domain || subscription.metadata.requested_domain || null;

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
      ? existingPlayer?.custom_domain_status === "active" ? "active" : "purchasing"
      : existingPlayer?.custom_domain ? "canceled" : "none",
  }).eq("user_id", userId).lte("stripe_event_created_at", eventCreated).select("user_id").maybeSingle();
  if (error) throw error;
  if (!updatedPlayer) return;

  if (hasCustomDomain && requestedDomain && existingPlayer?.custom_domain_status !== "active") {
    try {
      const provisioned = await provisionManagedDomain(requestedDomain);
      const { error: domainError } = await admin.from("players").update({
        custom_domain_status: "active",
        custom_domain_order_id: provisioned.orderId,
        custom_domain_purchase_price: provisioned.purchasePrice,
        custom_domain_error: null,
      }).eq("user_id", userId);
      if (domainError) throw domainError;
    } catch (domainError) {
      const message = domainError instanceof Error ? domainError.message : "Domain provisioning failed.";
      await admin.from("players").update({
        custom_domain_status: "failed",
        custom_domain_error: message.slice(0, 1000),
      }).eq("user_id", userId);
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
    if (event.type === "checkout.session.completed" && typeof event.data.object.subscription === "string") {
      await reconcileCustomer(await getStripe().subscriptions.retrieve(event.data.object.subscription), event.created);
    }
    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      await reconcileCustomer(event.data.object as Stripe.Subscription, event.created);
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
