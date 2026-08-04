import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { partnerAccess } from "@/lib/partners";
import { getPartnerCatalogPriceIds } from "@/lib/partner-stripe-catalog";
import { partnerAdminHostname } from "@/lib/domain-name";

export async function POST(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const access = await partnerAccess(user.id, organizationId, ["owner", "admin"]);
  if (!access) return NextResponse.json({ error: "Partner administrator access is required." }, { status: 403 });

  const stripe = getStripe();

  let customerId = access.organization.platform_stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: access.organization.billing_email || user.email || undefined,
      name: access.organization.name,
      metadata: { kind: "partner_wholesale", organization_id: organizationId },
    });
    customerId = customer.id;
    await createAdminClient().from("partner_organizations").update({ platform_stripe_customer_id: customerId }).eq("id", organizationId);
  }

  const requestUrl = new URL(request.url);
  const partnerAdminHost = access.organization.profile_domain && access.organization.profile_domain_status === "active"
    ? partnerAdminHostname(access.organization.profile_domain)
    : null;
  const origin = requestUrl.hostname === "localhost" || requestUrl.hostname === partnerAdminHost
    ? requestUrl.origin
    : getAppUrl();

  if (access.organization.partnership_type === "white_label") {
    if (access.organization.platform_stripe_subscription_id && ["active", "trialing", "past_due"].includes(access.organization.platform_subscription_status)) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/partner/${organizationId}`,
      });
      return NextResponse.json({ url: portal.url });
    }
    const prices = await getPartnerCatalogPriceIds();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: prices.whiteLabelBase, quantity: 1 }],
      allow_promotion_codes: true,
      payment_method_collection: "if_required",
      success_url: `${origin}/partner/${organizationId}?billing=ready&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/partner/${organizationId}?billing=canceled`,
      metadata: { kind: "partner_white_label_activation", organization_id: organizationId, user_id: user.id },
      subscription_data: { metadata: { kind: "partner_wholesale", organization_id: organizationId, partnership_type: "white_label" } },
    });
    if (!session.url) return NextResponse.json({ error: "Stripe did not return a white-label checkout URL." }, { status: 502 });
    return NextResponse.json({ url: session.url });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    payment_method_types: ["card"],
    success_url: `${origin}/partner/${organizationId}?billing=ready&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/partner/${organizationId}?billing=canceled`,
    metadata: { kind: "partner_billing_setup", organization_id: organizationId, user_id: user.id },
    setup_intent_data: { metadata: { kind: "partner_billing_setup", organization_id: organizationId, user_id: user.id } },
  });
  if (!session.url) return NextResponse.json({ error: "Stripe did not return a billing setup URL." }, { status: 502 });
  return NextResponse.json({ url: session.url });
}
