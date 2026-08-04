import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertStripeEventMode, getStripe } from "@/lib/stripe";
import { partnerSubscriptionEntitled } from "@/lib/partners";
import { syncPartnerWholesaleBilling } from "@/lib/partner-billing";
import { disableManagedDomainRenewal } from "@/lib/vercel-domains";

export const runtime = "nodejs";

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  return subscription.items.data.reduce((value, item) => Math.max(value, item.current_period_end || 0), 0);
}

async function applySubscription(event: Stripe.Event, subscription: Stripe.Subscription) {
  if (!event.account) return;
  const admin = createAdminClient();
  const mapped = await admin.from("partner_customer_subscriptions").select("*").eq("stripe_account_id", event.account).eq("stripe_subscription_id", subscription.id).maybeSingle();
  if (mapped.error) throw mapped.error;
  if (!mapped.data || mapped.data.last_event_created > event.created) return;
  const entitled = partnerSubscriptionEntitled(subscription.status);
  const canceling = entitled && subscription.cancel_at_period_end;
  const periodEnd = subscriptionPeriodEnd(subscription);
  const status = canceling ? "canceling" : subscription.status;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const updated = await admin.from("partner_customer_subscriptions").update({
    status,
    stripe_customer_id: customerId,
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    last_event_created: event.created,
  }).eq("id", mapped.data.id);
  if (updated.error) throw updated.error;
  const existingPlayer = await admin.from("players").select("custom_domain,has_custom_domain").eq("id", mapped.data.player_id).maybeSingle();
  if (existingPlayer.error) throw existingPlayer.error;
  const player = await admin.from("players").update({
    partner_billing_status: entitled ? status : "canceled",
    billing_tier: entitled ? mapped.data.tier : "free",
    subscription_status: entitled ? subscription.status : "canceled",
    partner_stripe_customer_id: customerId,
    partner_stripe_subscription_id: subscription.id,
    partner_access_expires_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    ...(entitled ? {} : { is_published: false, has_custom_domain: false, custom_domain_status: "canceled" }),
  }).eq("id", mapped.data.player_id);
  if (player.error) throw player.error;
  if (!entitled && existingPlayer.data?.has_custom_domain && existingPlayer.data.custom_domain) {
    await disableManagedDomainRenewal(existingPlayer.data.custom_domain);
  }
  await syncPartnerWholesaleBilling(mapped.data.organization_id);
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  const signature = (await headers()).get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Connect webhook is not configured." }, { status: 503 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
    assertStripeEventMode(event.livemode);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
  const admin = createAdminClient();
  const duplicate = await admin.from("stripe_webhook_events").select("status").eq("id", event.id).maybeSingle();
  if (duplicate.data?.status === "processed") return NextResponse.json({ received: true, duplicate: true });
  await admin.from("stripe_webhook_events").upsert({ id: event.id, type: `connect:${event.type}`, created: event.created, status: "processing", error: null });
  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const token = session.client_reference_id;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (token && subscriptionId && event.account) {
        const checkout = await admin.from("partner_profile_checkouts").select("*, partner_payment_links(tier), partner_organizations(stripe_account_id)").eq("token", token).eq("active", true).maybeSingle();
        if (checkout.error) throw checkout.error;
        const row = checkout.data as unknown as { id: string; organization_id: string; player_id: string; payment_link_id: string; partner_payment_links: { tier: "pro" | "elite" }; partner_organizations: { stripe_account_id: string } } | null;
        if (!row || row.partner_organizations.stripe_account_id !== event.account) throw new Error("Checkout did not match this connected partner.");
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {}, { stripeAccount: event.account });
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        const periodEnd = subscriptionPeriodEnd(subscription);
        const ledger = await admin.from("partner_customer_subscriptions").upsert({
          organization_id: row.organization_id,
          player_id: row.player_id,
          payment_link_id: row.payment_link_id,
          stripe_account_id: event.account,
          stripe_checkout_session_id: session.id,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          tier: row.partner_payment_links.tier,
          status: subscription.cancel_at_period_end ? "canceling" : subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          last_event_created: event.created,
        }, { onConflict: "stripe_account_id,stripe_subscription_id" });
        if (ledger.error) throw ledger.error;
        await admin.from("partner_profile_checkouts").update({ last_checkout_session_id: session.id }).eq("id", row.id);
        await applySubscription(event, subscription);
      }
    }
    if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      await applySubscription(event, event.data.object as Stripe.Subscription);
    }
    await admin.from("stripe_webhook_events").update({ status: "processed", processed_at: new Date().toISOString() }).eq("id", event.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connected account webhook failed.";
    await admin.from("stripe_webhook_events").update({ status: "failed", error: message.slice(0, 1000) }).eq("id", event.id);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
