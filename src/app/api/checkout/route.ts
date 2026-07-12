import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PlanId = "standard" | "premium";

const priceEnvironment: Record<PlanId, "STRIPE_STANDARD_PRICE_ID" | "STRIPE_PREMIUM_PRICE_ID"> = {
  standard: "STRIPE_STANDARD_PRICE_ID",
  premium: "STRIPE_PREMIUM_PRICE_ID",
};

function metadataValue(value: unknown, maxLength = 200) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Create an account to connect this subscription to your portfolio." }, { status: 401 });
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Checkout request was not valid." }, { status: 400 });
  }

  const plan = body.plan;
  if (plan !== "standard" && plan !== "premium") {
    return NextResponse.json({ error: "Choose a valid plan." }, { status: 400 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env[priceEnvironment[plan]];

  if (!secretKey || !priceId) {
    return NextResponse.json(
      { error: "Checkout is not connected yet. Add the Stripe keys to enable secure payments." },
      { status: 503 },
    );
  }

  const origin = new URL(request.url).origin;
  const slug = metadataValue(body.slug, 100);
  const playerName = metadataValue(body.playerName, 150);
  const domain = plan === "premium" ? metadataValue(body.domain, 253) : "";

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("allow_promotion_codes", "true");
  params.set("success_url", `${origin}/builder?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${origin}/builder?checkout=canceled`);
  params.set("client_reference_id", user.id);
  params.set("customer_email", user.email || "");
  params.set("metadata[user_id]", user.id);
  params.set("metadata[plan]", plan);
  params.set("subscription_data[metadata][user_id]", user.id);
  params.set("subscription_data[metadata][plan]", plan);

  if (slug) {
    params.set("metadata[builder_slug]", slug);
    params.set("subscription_data[metadata][builder_slug]", slug);
  }
  if (playerName) {
    params.set("metadata[player_name]", playerName);
    params.set("subscription_data[metadata][player_name]", playerName);
  }
  if (domain) {
    params.set("metadata[requested_domain]", domain);
    params.set("subscription_data[metadata][requested_domain]", domain);
  }

  try {
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
      cache: "no-store",
    });
    const session = (await stripeResponse.json()) as { url?: string; error?: { message?: string } };

    if (!stripeResponse.ok || !session.url) {
      console.error("Stripe checkout session failed", session.error?.message || stripeResponse.statusText);
      return NextResponse.json({ error: "Checkout could not start. Check the Stripe price setup and try again." }, { status: 502 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout request failed", error);
    return NextResponse.json({ error: "Checkout is temporarily unavailable. Try again in a moment." }, { status: 502 });
  }
}
