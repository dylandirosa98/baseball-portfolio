import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/stripe";
import { partnerAccess } from "@/lib/partners";

export async function POST(_request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await partnerAccess(user.id, organizationId, ["owner", "admin"]))) {
    return NextResponse.json({ error: "Partner administrator access is required." }, { status: 403 });
  }
  let clientId = process.env.STRIPE_CONNECT_CLIENT_ID;
  if (!clientId) {
    const setting = await createAdminClient().from("platform_settings").select("value").eq("key", "stripe_connect_client_id").maybeSingle();
    if (setting.error) return NextResponse.json({ error: "Stripe Connect configuration could not be read." }, { status: 500 });
    clientId = setting.data?.value;
  }
  if (!clientId) return NextResponse.json({ error: "Stripe Connect is not configured yet." }, { status: 503 });

  const state = crypto.randomUUID();
  const { error } = await createAdminClient().from("partner_stripe_oauth_states").insert({
    state,
    organization_id: organizationId,
    user_id: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const url = new URL("https://connect.stripe.com/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", "read_write");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", `${getAppUrl()}/api/partner/stripe/callback`);
  return NextResponse.json({ url: url.toString() });
}
