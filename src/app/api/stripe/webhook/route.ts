import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    if (userId) {
      const plan = session.metadata?.plan === "premium" ? "premium" : "standard";
      const domain = plan === "premium" ? session.metadata?.requested_domain || null : null;
      await admin
        .from("players")
        .update({
          plan,
          subscription_status: "active",
          stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
          custom_domain: domain,
          is_published: true,
        })
        .eq("user_id", userId);
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const userId = subscription.metadata.user_id;
    if (userId) {
      const active = subscription.status === "active" || subscription.status === "trialing";
      await admin
        .from("players")
        .update({
          subscription_status: subscription.status,
          is_published: active,
          plan: subscription.metadata.plan === "premium" ? "premium" : "standard",
        })
        .eq("user_id", userId);
    }
  }

  return NextResponse.json({ received: true });
}
