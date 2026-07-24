import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl, getStripe, isEntitled } from "@/lib/stripe";
import { isStandardComDomain, normalizeManagedDomain } from "@/lib/domain-name";
import { getDomainAvailability, getDomainPrice, maximumDomainPrice } from "@/lib/vercel-domains";


function metadataValue(value: unknown, maxLength = 200) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, maxLength) : "";
}

function attributionMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "landing_page", "captured_at"];
  return Object.fromEntries(keys.flatMap((key) => {
    const item = typeof source[key] === "string" ? source[key].trim().slice(0, 300) : "";
    return item ? [["attribution_" + key, item]] : [];
  }));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Create an account to connect this subscription to your portfolio." }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Checkout request was not valid." }, { status: 400 }); }

  const tier = body.tier;
  const wantsCustomDomain = body.customDomain === true;
  if (tier !== "free" && tier !== "pro" && tier !== "elite") {
    return NextResponse.json({ error: "Choose a valid plan." }, { status: 400 });
  }
  if (tier === "free" && !wantsCustomDomain) {
    return NextResponse.json({ error: "Free publishing does not require checkout." }, { status: 400 });
  }

  const tierPriceId = tier === "pro"
    ? process.env.STRIPE_PRO_PRICE_ID
    : tier === "elite"
      ? process.env.STRIPE_ELITE_PRICE_ID
      : null;
  const domainPriceId = process.env.STRIPE_CUSTOM_DOMAIN_PRICE_ID;
  if (!process.env.STRIPE_SECRET_KEY || (tier !== "free" && !tierPriceId) || (wantsCustomDomain && !domainPriceId)) {
    return NextResponse.json({ error: "Checkout is not connected yet. Add the Stripe keys and price IDs." }, { status: 503 });
  }

  const { data: player } = await supabase
    .from("players")
    .select("stripe_customer_id, custom_domain")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!player) return NextResponse.json({ error: "Save your portfolio before starting checkout." }, { status: 409 });

  const domain = wantsCustomDomain ? normalizeManagedDomain(metadataValue(body.domain, 253)) : "";
  if (wantsCustomDomain && !isStandardComDomain(domain)) {
    return NextResponse.json({ error: "Choose an available standard .com domain before checkout." }, { status: 400 });
  }
  if (wantsCustomDomain && domain !== player.custom_domain) {
    try {
      const { data: claimed, error: claimedError } = await createAdminClient()
        .from("players")
        .select("user_id")
        .eq("custom_domain", domain)
        .maybeSingle();
      if (claimedError) throw claimedError;
      if (claimed && claimed.user_id !== user.id) {
        return NextResponse.json({ error: "That domain is no longer available. Choose another one." }, { status: 409 });
      }
      if (!(await getDomainAvailability(domain))) {
        return NextResponse.json({ error: "That domain is no longer available. Choose another one." }, { status: 409 });
      }
      const domainPrice = await getDomainPrice(domain);
      if (domainPrice.purchasePrice > maximumDomainPrice()) {
        return NextResponse.json({ error: "That domain is not standard-priced. Choose another .com." }, { status: 409 });
      }
    } catch (domainError) {
      console.error("Pre-checkout domain verification failed", domainError);
      return NextResponse.json({ error: "Domain verification is temporarily unavailable. Try again shortly." }, { status: 502 });
    }
  }

  const stripe = getStripe();
  const existingPriceIds = new Set<string>();
  if (player?.stripe_customer_id) {
    const subscriptions = await stripe.subscriptions.list({
      customer: player.stripe_customer_id,
      status: "all",
      limit: 100,
    });
    for (const subscription of subscriptions.data.filter((item) => isEntitled(item.status))) {
      for (const item of subscription.items.data) existingPriceIds.add(item.price.id);
    }
  }

  const currentTier: "free" | "pro" | "elite" = existingPriceIds.has(process.env.STRIPE_ELITE_PRICE_ID || "")
    ? "elite"
    : existingPriceIds.has(process.env.STRIPE_PRO_PRICE_ID || "")
      ? "pro"
      : "free";
  if (tier !== "free" && currentTier !== "free" && tier !== currentTier) {
    return NextResponse.json({ error: "Use Manage billing in your account to change an existing paid plan." }, { status: 409 });
  }

  const effectiveTier = currentTier !== "free" ? currentTier : tier;
  const needsTier = tierPriceId ? !existingPriceIds.has(tierPriceId) : false;
  const needsDomain = Boolean(wantsCustomDomain && domainPriceId && !existingPriceIds.has(domainPriceId));
  if (!needsTier && !needsDomain) {
    return NextResponse.json({ error: "That subscription is already active. Manage it from your account." }, { status: 409 });
  }

  const metadata: Record<string, string> = {
    user_id: user.id,
    billing_tier: effectiveTier,
    has_custom_domain: String(needsDomain),
    ...attributionMetadata(body.attribution),
  };
  const slug = metadataValue(body.slug, 100);
  const playerName = typeof body.playerName === "string" ? body.playerName.trim().slice(0, 150) : "";
  if (slug) metadata.builder_slug = slug;
  if (playerName) metadata.player_name = playerName;
  if (domain) metadata.requested_domain = domain;

  const lineItems = [
    ...(needsTier && tierPriceId ? [{ price: tierPriceId, quantity: 1 }] : []),
    ...(needsDomain && domainPriceId ? [{ price: domainPriceId, quantity: 1 }] : []),
  ];

  try {
    const origin = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: lineItems,
      allow_promotion_codes: true,
      branding_settings: { display_name: "Diamond Profile" },
      success_url: origin + "/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/builder?checkout=canceled&mode=edit&step=review&returnTo=%2Fdashboard",
      client_reference_id: user.id,
      ...(player?.stripe_customer_id ? { customer: player.stripe_customer_id } : { customer_email: user.email || undefined }),
      metadata,
      subscription_data: { metadata },
    });
    if (!session.url) return NextResponse.json({ error: "Checkout did not return a redirect URL." }, { status: 502 });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout request failed", error);
    return NextResponse.json({ error: "Checkout is temporarily unavailable. Try again in a moment." }, { status: 502 });
  }
}
