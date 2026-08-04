import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { partnerAccess } from "@/lib/partners";
import { syncPartnerWholesaleBilling } from "@/lib/partner-billing";
import { getDomainAvailability, getDomainPrice, maximumDomainPrice, provisionManagedDomain, disableManagedDomainRenewal } from "@/lib/vercel-domains";
import { isStandardComDomain, normalizeManagedDomain } from "@/lib/domain-name";

export async function POST(request: Request, context: { params: Promise<{ organizationId: string; playerId: string }> }) {
  const { organizationId, playerId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const access = user ? await partnerAccess(user.id, organizationId, ["owner", "admin"]) : null;
  if (!user || !access) return NextResponse.json({ error: "Partner administrator access is required." }, { status: 403 });
  if (!access.organization.billing_payment_method_ready) return NextResponse.json({ error: "Set up partner billing before adding a player domain." }, { status: 409 });

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const domain = normalizeManagedDomain(String(body.domain || ""));
  if (!isStandardComDomain(domain)) return NextResponse.json({ error: "Use a standard .com domain." }, { status: 400 });
  const admin = createAdminClient();
  const playerResult = await admin.from("players").select("id,custom_domain,has_custom_domain,custom_domain_status,custom_domain_order_id,custom_domain_purchase_price").eq("id", playerId).eq("organization_id", organizationId).maybeSingle();
  if (playerResult.error) return NextResponse.json({ error: playerResult.error.message }, { status: 500 });
  if (!playerResult.data) return NextResponse.json({ error: "Athlete was not found." }, { status: 404 });
  const claimed = await admin.from("players").select("id").eq("custom_domain", domain).neq("id", playerId).maybeSingle();
  if (claimed.error) return NextResponse.json({ error: claimed.error.message }, { status: 500 });
  if (claimed.data) return NextResponse.json({ error: "That domain is already assigned." }, { status: 409 });

  try {
    if (!(await getDomainAvailability(domain))) return NextResponse.json({ error: "That domain is not available." }, { status: 409 });
    const price = await getDomainPrice(domain);
    if (price.purchasePrice > maximumDomainPrice()) return NextResponse.json({ error: "That domain is above the managed purchase limit." }, { status: 409 });
    const update = await admin.from("players").update({
      has_custom_domain: true,
      custom_domain: domain,
      custom_domain_status: "purchasing",
      custom_domain_order_id: null,
      custom_domain_purchase_price: null,
      custom_domain_error: null,
    }).eq("id", playerId).select("id").single();
    if (update.error) throw update.error;
    await syncPartnerWholesaleBilling(organizationId);
    const provisioned = await provisionManagedDomain(domain);
    const completed = await admin.from("players").update({
      custom_domain_status: provisioned.status,
      custom_domain_order_id: provisioned.orderId,
      custom_domain_purchase_price: provisioned.purchasePrice ?? price.purchasePrice,
    }).eq("id", playerId).select("custom_domain_status,custom_domain_order_id").single();
    if (completed.error) throw completed.error;
    return NextResponse.json({ domain, ...completed.data, platformMonthlyCents: access.organization.domain_wholesale_cents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Domain provisioning failed.";
    await admin.from("players").update({ has_custom_domain: false, custom_domain_status: "failed", custom_domain_error: message.slice(0, 1000) }).eq("id", playerId);
    await syncPartnerWholesaleBilling(organizationId).catch(() => undefined);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ organizationId: string; playerId: string }> }) {
  const { organizationId, playerId } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const access = user ? await partnerAccess(user.id, organizationId, ["owner", "admin"]) : null;
  if (!user || !access) return NextResponse.json({ error: "Partner administrator access is required." }, { status: 403 });
  const admin = createAdminClient();
  const player = await admin.from("players").select("custom_domain").eq("id", playerId).eq("organization_id", organizationId).maybeSingle();
  if (player.error) return NextResponse.json({ error: player.error.message }, { status: 500 });
  if (!player.data) return NextResponse.json({ error: "Athlete was not found." }, { status: 404 });
  if (player.data.custom_domain) await disableManagedDomainRenewal(player.data.custom_domain);
  const update = await admin.from("players").update({ has_custom_domain: false, custom_domain_status: "canceled" }).eq("id", playerId);
  if (update.error) return NextResponse.json({ error: update.error.message }, { status: 500 });
  await syncPartnerWholesaleBilling(organizationId);
  return NextResponse.json({ canceled: true });
}
