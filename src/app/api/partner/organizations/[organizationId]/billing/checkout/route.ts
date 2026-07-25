import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { partnerAccess } from "@/lib/partners";

export async function POST(_request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const access = await partnerAccess(user.id, organizationId, ["owner", "admin"]);
  if (!access) return NextResponse.json({ error: "Partner administrator access is required." }, { status: 403 });

  let customerId = access.organization.platform_stripe_customer_id;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: access.organization.billing_email || user.email || undefined,
      name: access.organization.name,
      metadata: { kind: "partner_wholesale", organization_id: organizationId },
    });
    customerId = customer.id;
    await createAdminClient().from("partner_organizations").update({ platform_stripe_customer_id: customerId }).eq("id", organizationId);
  }

  const origin = getAppUrl();
  const session = await getStripe().checkout.sessions.create({
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
