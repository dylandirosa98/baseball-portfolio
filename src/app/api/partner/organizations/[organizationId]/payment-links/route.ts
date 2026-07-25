import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { partnerAccess } from "@/lib/partners";

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
  if (!name || !tier || !/^https:\/\/(?:buy|checkout)\.stripe\.com\//.test(url)) {
    return NextResponse.json({ error: "Add a name, Pro or Elite tier, and a valid Stripe Payment Link." }, { status: 400 });
  }

  const stripe = getStripe();
  const options = { stripeAccount: access.organization.stripe_account_id };
  let match = null;
  let startingAfter: string | undefined;
  for (let page = 0; page < 10 && !match; page += 1) {
    const links = await stripe.paymentLinks.list({ active: true, limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) }, options);
    match = links.data.find((link) => link.url === url) || null;
    if (!links.has_more || links.data.length === 0) break;
    startingAfter = links.data.at(-1)?.id;
  }
  if (!match) return NextResponse.json({ error: "That link was not found in the connected Stripe account." }, { status: 404 });
  const lines = await stripe.paymentLinks.listLineItems(match.id, { limit: 100 }, options);
  if (lines.data.length !== 1 || !lines.data[0].price?.recurring) {
    return NextResponse.json({ error: "Use a Payment Link containing one recurring subscription price." }, { status: 400 });
  }
  const price = lines.data[0].price;
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
