import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ManagedDomainOrderFailedError, provisionManagedDomain } from "@/lib/vercel-domains";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PendingDomain = {
  user_id: string;
  custom_domain: string;
  custom_domain_order_id: string | null;
  custom_domain_purchase_price: number | null;
  updated_at: string;
};

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return NextResponse.json({ error: "Domain reconciliation is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("players")
    .select("user_id,custom_domain,custom_domain_order_id,custom_domain_purchase_price,updated_at")
    .eq("has_custom_domain", true)
    .eq("custom_domain_status", "purchasing")
    .not("custom_domain", "is", null)
    .order("updated_at")
    .limit(50);
  if (error) return NextResponse.json({ error: "Pending domains could not be loaded." }, { status: 500 });

  let active = 0;
  let pending = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of (data ?? []) as PendingDomain[]) {
    let orderId = row.custom_domain_order_id;
    if (orderId?.startsWith("initiating:")) {
      const claimAge = Date.now() - new Date(row.updated_at).getTime();
      if (claimAge >= 24 * 60 * 60 * 1000) {
        await admin.from("players").update({
          custom_domain_status: "failed",
          custom_domain_error: "Domain purchase initiation did not return an order ID. Manual review is required.",
        }).eq("user_id", row.user_id).eq("custom_domain_order_id", orderId);
        failed += 1;
      } else {
        pending += 1;
      }
      continue;
    }

    if (!orderId) {
      const claimId = `initiating:cron:${crypto.randomUUID()}`;
      const { data: claimed } = await admin.from("players").update({
        custom_domain_order_id: claimId,
        custom_domain_error: null,
      }).eq("user_id", row.user_id)
        .eq("custom_domain", row.custom_domain)
        .eq("custom_domain_status", "purchasing")
        .is("custom_domain_order_id", null)
        .select("user_id")
        .maybeSingle();
      if (!claimed) {
        skipped += 1;
        continue;
      }
      orderId = null;
    }

    try {
      const provisioned = await provisionManagedDomain(row.custom_domain, orderId);
      const { error: updateError } = await admin.from("players").update({
        custom_domain_status: provisioned.status,
        custom_domain_order_id: provisioned.orderId,
        custom_domain_purchase_price: provisioned.purchasePrice ?? row.custom_domain_purchase_price,
        custom_domain_error: null,
      }).eq("user_id", row.user_id).eq("custom_domain", row.custom_domain);
      if (updateError) throw updateError;
      if (provisioned.status === "active") active += 1;
      else pending += 1;
    } catch (domainError) {
      const message = domainError instanceof Error ? domainError.message : "Domain reconciliation failed.";
      const terminal = domainError instanceof ManagedDomainOrderFailedError;
      await admin.from("players").update({
        custom_domain_status: terminal ? "failed" : "purchasing",
        custom_domain_error: message.slice(0, 1000),
      }).eq("user_id", row.user_id).eq("custom_domain", row.custom_domain);
      if (terminal) failed += 1;
      else pending += 1;
    }
  }

  return NextResponse.json({ checked: data?.length || 0, active, pending, failed, skipped });
}
