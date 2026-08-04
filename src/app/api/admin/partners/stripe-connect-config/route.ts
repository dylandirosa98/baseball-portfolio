import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/admin-auth";

async function adminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user && isPlatformAdmin(user.email) ? user : null;
}

export async function GET() {
  const user = await adminUser();
  if (!user) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({
    snapshotWebhookConfigured: Boolean(process.env.STRIPE_CONNECT_WEBHOOK_SECRET),
    thinWebhookConfigured: Boolean(process.env.STRIPE_CONNECT_V2_WEBHOOK_SECRET),
  });
}
