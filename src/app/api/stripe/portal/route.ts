import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl, getStripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: player } = await supabase.from("players").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!player?.stripe_customer_id) return NextResponse.json({ error: "No billing account was found." }, { status: 404 });

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: player.stripe_customer_id,
      return_url: `${getAppUrl()}/account`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe billing portal request failed", error);
    return NextResponse.json({ error: "Billing management is temporarily unavailable." }, { status: 502 });
  }
}
