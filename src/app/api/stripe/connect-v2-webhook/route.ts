import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertStripeEventMode, getStripe } from "@/lib/stripe";
import { cachePartnerStripeAccountStatus } from "@/lib/stripe-connect";
import { ensurePartnerDefaultPricing } from "@/lib/partner-pricing";
import type { PartnerOrganizationRow } from "@/lib/partners";

export const runtime = "nodejs";

async function synchronizeAccount(account: Stripe.V2.Core.Account) {
  const admin = createAdminClient();
  const { data: organization, error } = await admin.from("partner_organizations")
    .select("*")
    .eq("stripe_account_id", account.id)
    .maybeSingle();
  if (error) throw error;
  // Events can arrive after an account was closed or removed locally. A missing
  // mapping is safe to acknowledge because there is no organization to update.
  if (!organization) return;
  const state = await cachePartnerStripeAccountStatus(organization.id, account);
  if (state.status === "active") {
    await ensurePartnerDefaultPricing({ ...organization, stripe_account_status: "active" } as PartnerOrganizationRow);
  }
}

async function handleAccountNotification(notification: Stripe.V2.Core.EventNotification) {
  // V2 thin notifications deliberately omit the full Account. Fetching the
  // related object gives every handler current requirements and capability data.
  switch (notification.type) {
    case "v2.core.account[requirements].updated":
    case "v2.core.account[configuration.merchant].capability_status_updated":
    case "v2.core.account[configuration.customer].capability_status_updated":
    case "v2.core.account.updated":
    case "v2.core.account.closed": {
      const account = await notification.fetchRelatedObject();
      await synchronizeAccount(account);
      return true;
    }
    default:
      return false;
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_CONNECT_V2_WEBHOOK_SECRET;
  const signature = (await headers()).get("stripe-signature");
  if (!webhookSecret) return NextResponse.json({ error: "Stripe V2 account webhook is not configured." }, { status: 503 });
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  let notification: Stripe.V2.Core.EventNotification;
  try {
    notification = await getStripe().parseEventNotificationAsync(await request.text(), signature, webhookSecret);
    assertStripeEventMode(notification.livemode);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe thin event." }, { status: 400 });
  }

  const admin = createAdminClient();
  const existing = await admin.from("stripe_webhook_events").select("status").eq("id", notification.id).maybeSingle();
  if (existing.data?.status === "processed") return NextResponse.json({ received: true, duplicate: true });
  const created = Math.floor(Date.parse(notification.created) / 1000);
  const recorded = await admin.from("stripe_webhook_events").upsert({
    id: notification.id,
    type: `connect-v2:${notification.type}`,
    created: Number.isFinite(created) ? created : Math.floor(Date.now() / 1000),
    status: "processing",
    error: null,
  });
  if (recorded.error) return NextResponse.json({ error: "Webhook event could not be recorded." }, { status: 500 });

  try {
    const handled = await handleAccountNotification(notification);
    const updated = await admin.from("stripe_webhook_events").update({
      status: "processed",
      processed_at: new Date().toISOString(),
    }).eq("id", notification.id);
    if (updated.error) throw updated.error;
    return NextResponse.json({ received: true, handled });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe V2 account webhook failed.";
    await admin.from("stripe_webhook_events").update({ status: "failed", error: message.slice(0, 1000) }).eq("id", notification.id);
    console.error("Stripe V2 Connect webhook failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
