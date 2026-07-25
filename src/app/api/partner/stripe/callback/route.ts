import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl, getStripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") || "";
  const code = request.nextUrl.searchParams.get("code") || "";
  const admin = createAdminClient();
  const { data: oauthState } = await admin.from("partner_stripe_oauth_states")
    .select("organization_id, expires_at, used_at")
    .eq("state", state)
    .maybeSingle();
  const destination = oauthState?.organization_id ? `/partner/${oauthState.organization_id}` : "/partner";
  if (!state || !code || !oauthState || oauthState.used_at || new Date(oauthState.expires_at) <= new Date()) {
    return NextResponse.redirect(`${getAppUrl()}${destination}?stripe=invalid`);
  }

  try {
    const response = await getStripe().oauth.token({ grant_type: "authorization_code", code });
    if (!response.stripe_user_id) throw new Error("Stripe did not return a connected account ID.");
    const account = await getStripe().accounts.retrieve(response.stripe_user_id);
    const status = account.charges_enabled && account.payouts_enabled
      ? "active"
      : account.details_submitted ? "restricted" : "pending";
    const { error } = await admin.from("partner_organizations").update({
      stripe_account_id: account.id,
      stripe_account_status: status,
    }).eq("id", oauthState.organization_id);
    if (error) throw error;
    await admin.from("partner_stripe_oauth_states").update({ used_at: new Date().toISOString() }).eq("state", state);
    return NextResponse.redirect(`${getAppUrl()}${destination}?stripe=connected`);
  } catch (error) {
    console.error("Partner Stripe connection failed", error);
    return NextResponse.redirect(`${getAppUrl()}${destination}?stripe=failed`);
  }
}
