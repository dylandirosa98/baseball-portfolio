import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { partnerAccess } from "@/lib/partners";
import { syncPartnerWholesaleBilling } from "@/lib/partner-billing";

export async function PATCH(request: NextRequest, context: { params: Promise<{ organizationId: string; playerId: string }> }) {
  const { organizationId, playerId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const access = await partnerAccess(user.id, organizationId, ["owner", "admin"]);
  if (!access) return NextResponse.json({ error: "Organization access was not found." }, { status: 404 });
  const admin = createAdminClient();
  const result = await admin.from("players").select("*").eq("id", playerId).eq("organization_id", organizationId).maybeSingle();
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "Athlete was not found." }, { status: 404 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = String(body.action || "");
  try {
    if (action === "activate" && result.data.partner_billing_source === "partner_paid") {
      const activatedWhiteLabel = access.organization.partnership_type === "white_label" && access.organization.status === "active";
      if (!access.organization.billing_payment_method_ready && !access.organization.wholesale_billing_exempt && !activatedWhiteLabel) return NextResponse.json({ error: "Set up partner billing first." }, { status: 409 });
      const playerUpdate = await admin.from("players").update({ partner_billing_status: "active", billing_tier: result.data.partner_plan, subscription_status: "active" }).eq("id", playerId);
      if (playerUpdate.error) throw playerUpdate.error;
    } else if (action === "change_plan") {
      const plan = body.plan === "elite" ? "elite" : body.plan === "pro" ? "pro" : null;
      if (!plan) return NextResponse.json({ error: "Choose Pro or Elite." }, { status: 400 });
      if (result.data.partner_billing_source === "partner_paid") {
        await admin.from("players").update({ partner_plan: plan, billing_tier: result.data.partner_billing_status === "active" ? plan : "free" }).eq("id", playerId);
      } else {
        const link = await admin.from("partner_payment_links").select("id, stripe_price_id").eq("id", String(body.paymentLinkId || "")).eq("organization_id", organizationId).eq("tier", plan).eq("active", true).maybeSingle();
        if (link.error) throw link.error;
        if (!link.data) return NextResponse.json({ error: `Select a verified ${plan} payment link.` }, { status: 400 });
        if (result.data.partner_stripe_subscription_id && access.organization.stripe_account_id && ["trialing", "active", "past_due", "canceling"].includes(result.data.partner_billing_status)) {
          const subscription = await getStripe().subscriptions.retrieve(result.data.partner_stripe_subscription_id, {}, { stripeAccount: access.organization.stripe_account_id });
          const item = subscription.items.data[0];
          if (!item || !link.data.stripe_price_id) throw new Error("The connected subscription or Payment Link price is incomplete.");
          await getStripe().subscriptions.update(subscription.id, { items: [{ id: item.id, price: link.data.stripe_price_id }], proration_behavior: "create_prorations" }, { stripeAccount: access.organization.stripe_account_id });
          const ledgerUpdate = await admin.from("partner_customer_subscriptions").update({ tier: plan, payment_link_id: link.data.id }).eq("stripe_account_id", access.organization.stripe_account_id).eq("stripe_subscription_id", subscription.id);
          if (ledgerUpdate.error) throw ledgerUpdate.error;
        }
        const oldCheckouts = await admin.from("partner_profile_checkouts").update({ active: false }).eq("player_id", playerId);
        if (oldCheckouts.error) throw oldCheckouts.error;
        const checkoutUpsert = await admin.from("partner_profile_checkouts").upsert({ organization_id: organizationId, player_id: playerId, payment_link_id: link.data.id, active: true }, { onConflict: "player_id,payment_link_id" });
        if (checkoutUpsert.error) throw checkoutUpsert.error;
        const playerUpdate = await admin.from("players").update({
          partner_plan: plan,
          partner_payment_link_id: link.data.id,
          billing_tier: ["trialing", "active", "past_due", "canceling"].includes(result.data.partner_billing_status) ? plan : "free",
        }).eq("id", playerId);
        if (playerUpdate.error) throw playerUpdate.error;
      }
    } else if (action === "deactivate") {
      if (result.data.partner_billing_source === "customer_subscription" && result.data.partner_stripe_subscription_id && access.organization.stripe_account_id) {
        try {
          await getStripe().subscriptions.cancel(result.data.partner_stripe_subscription_id, {}, { stripeAccount: access.organization.stripe_account_id });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Stripe cancellation failed.";
          if (!/no such subscription|already been canceled|resource_missing/i.test(message)) throw error;
        }
      }
      const checkoutUpdate = await admin.from("partner_profile_checkouts").update({ active: false }).eq("player_id", playerId);
      if (checkoutUpdate.error) throw checkoutUpdate.error;
      const playerUpdate = await admin.from("players").update({
        partner_billing_status: "canceled",
        billing_tier: "free",
        subscription_status: "canceled",
        is_published: false,
        partner_access_expires_at: null,
      }).eq("id", playerId);
      if (playerUpdate.error) throw playerUpdate.error;
    } else {
      return NextResponse.json({ error: "Unsupported athlete action." }, { status: 400 });
    }
    await syncPartnerWholesaleBilling(organizationId);
    const checkout = await admin.from("partner_profile_checkouts").select("token").eq("player_id", playerId).eq("active", true).maybeSingle();
    return NextResponse.json({ ok: true, checkoutToken: checkout.data?.token || null });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Athlete billing update failed." }, { status: 500 });
  }
}
