import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlatformAdmin } from "@/lib/admin-auth";

async function adminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user && isPlatformAdmin(user.email) ? user : null;
}

export async function GET() {
  const user = await adminUser();
  if (!user) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const setting = await createAdminClient().from("platform_settings").select("value").eq("key", "stripe_connect_client_id").maybeSingle();
  if (setting.error) return NextResponse.json({ error: setting.error.message }, { status: 500 });
  return NextResponse.json({
    clientIdConfigured: Boolean(process.env.STRIPE_CONNECT_CLIENT_ID || setting.data?.value),
    webhookConfigured: Boolean(process.env.STRIPE_CONNECT_WEBHOOK_SECRET),
  });
}

export async function PUT(request: Request) {
  const user = await adminUser();
  if (!user) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const clientId = String(body.clientId || "").trim();
  if (!/^ca_[A-Za-z0-9]{20,}$/.test(clientId)) {
    return NextResponse.json({ error: "Enter the Stripe Connect client ID beginning with ca_." }, { status: 400 });
  }
  const result = await createAdminClient().from("platform_settings").upsert({
    key: "stripe_connect_client_id",
    value: clientId,
    updated_by: user.id,
  }, { onConflict: "key" });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ clientIdConfigured: true, webhookConfigured: Boolean(process.env.STRIPE_CONNECT_WEBHOOK_SECRET) });
}
