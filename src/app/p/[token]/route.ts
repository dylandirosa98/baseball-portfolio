import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { partnerJoinOrigin } from "@/lib/partner-athlete-invitations";
import type { PartnerOrganizationRow } from "@/lib/partners";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const admin = createAdminClient();
  const result = await admin.from("partner_profile_checkouts").select("id, token, active, player_id, organization_id, last_checkout_session_id, partner_payment_links(id, stripe_price_id, active, tier), partner_organizations(*), players(first_name,last_name,invited_email,partner_billing_status)").eq("token", token).maybeSingle();
  if (result.error || !result.data) return NextResponse.redirect(new URL("/?checkout=invalid", process.env.NEXT_PUBLIC_APP_URL));
  const row = result.data as unknown as {
    id: string; token: string; active: boolean; player_id: string; organization_id: string; last_checkout_session_id: string | null;
    partner_payment_links: { id: string; stripe_price_id: string | null; active: boolean; tier: string } | null;
    partner_organizations: PartnerOrganizationRow | null;
    players: { first_name: string; last_name: string; invited_email: string | null; partner_billing_status: string } | null;
  };
  if (!row.active || !row.partner_payment_links?.active || !row.partner_payment_links.stripe_price_id || !row.partner_organizations?.stripe_account_id || !row.players || row.partner_organizations.status !== "active" || row.partner_organizations.stripe_account_status !== "active") {
    return NextResponse.redirect(new URL("/?checkout=unavailable", process.env.NEXT_PUBLIC_APP_URL));
  }
  if (["active", "trialing", "past_due", "canceling"].includes(row.players.partner_billing_status)) {
    return NextResponse.redirect(new URL(`/join/${token}`, partnerJoinOrigin(row.partner_organizations)));
  }
  try {
    if (row.last_checkout_session_id) {
      try {
        const previous = await getStripe().checkout.sessions.retrieve(row.last_checkout_session_id, {}, { stripeAccount: row.partner_organizations.stripe_account_id });
        if (previous.status === "open" && previous.url) return NextResponse.redirect(previous.url);
        if (previous.status === "complete" && previous.payment_status === "paid") {
          return NextResponse.redirect(`${getAppUrl()}/dashboard?checkout=success&partner_billing=pending&session_id=${previous.id}`);
        }
      } catch (error) {
        console.warn("Previous connected checkout session could not be reused", error);
      }
    }
    // This is a direct subscription charge on the partner's connected account.
    // Diamond Profile's wholesale seat is billed separately to the organization,
    // so no application fee is deducted from the athlete's retail price here.
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      client_reference_id: token,
      line_items: [{ price: row.partner_payment_links.stripe_price_id, quantity: 1 }],
      customer_email: row.players.invited_email || undefined,
      allow_promotion_codes: true,
      success_url: `${getAppUrl()}/dashboard?checkout=success&partner_billing=pending&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${partnerJoinOrigin(row.partner_organizations)}/join/${token}?checkout=canceled`,
      metadata: { managed_by: "diamond_profile", organization_id: row.organization_id, player_id: row.player_id, checkout_token: token },
      subscription_data: { metadata: { managed_by: "diamond_profile", organization_id: row.organization_id, player_id: row.player_id, checkout_token: token, tier: row.partner_payment_links.tier } },
    }, { stripeAccount: row.partner_organizations.stripe_account_id });
    await admin.from("partner_profile_checkouts").update({ last_checkout_session_id: session.id }).eq("id", row.id);
    if (!session.url) throw new Error("Stripe did not return a Checkout URL.");
    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error("Connected athlete checkout could not be created", error);
    return NextResponse.redirect(new URL("/?checkout=unavailable", process.env.NEXT_PUBLIC_APP_URL));
  }
}
