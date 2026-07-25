import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const admin = createAdminClient();
  const result = await admin.from("partner_profile_checkouts").select("token, active, partner_payment_links(url, active), partner_organizations(status, stripe_account_status)").eq("token", token).maybeSingle();
  if (result.error || !result.data) return NextResponse.redirect(new URL("/?checkout=invalid", process.env.NEXT_PUBLIC_APP_URL));
  const row = result.data as unknown as { active: boolean; partner_payment_links: { url: string; active: boolean } | null; partner_organizations: { status: string; stripe_account_status: string } | null };
  if (!row.active || !row.partner_payment_links?.active || row.partner_organizations?.status !== "active" || row.partner_organizations?.stripe_account_status !== "active") {
    return NextResponse.redirect(new URL("/?checkout=unavailable", process.env.NEXT_PUBLIC_APP_URL));
  }
  const url = new URL(row.partner_payment_links.url);
  url.searchParams.set("client_reference_id", token);
  return NextResponse.redirect(url);
}

