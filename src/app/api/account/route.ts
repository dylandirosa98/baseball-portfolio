import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteMuxAsset } from "@/lib/mux";
import { getStripe } from "@/lib/stripe";
import { disableManagedDomainRenewal } from "@/lib/vercel-domains";

function collectMuxAssetIds(value: unknown, found = new Set<string>()) {
  if (Array.isArray(value)) value.forEach((item) => collectMuxAssetIds(item, found));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (key === "muxAssetId" && typeof child === "string" && child) found.add(child);
      else collectMuxAssetIds(child, found);
    }
  }
  return found;
}

async function listStorageFiles(prefix: string, found: string[] = []) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("player-images").list(prefix, { limit: 1000 });
  if (error) throw error;
  for (const item of data ?? []) {
    const path = `${prefix}/${item.name}`;
    if (item.id) found.push(path);
    else await listStorageFiles(path, found);
  }
  return found;
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data: player, error } = await supabase.from("players").select("*").eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (player?.stripe_subscription_id && ["active", "trialing", "past_due"].includes(player.subscription_status)) {
    return NextResponse.json({ error: "Cancel the active subscription from Manage billing before deleting this account." }, { status: 409 });
  }

  const admin = createAdminClient();
  const { data: muxUploads } = await admin.from("mux_uploads").select("asset_id").eq("user_id", user.id);
  const assetIds = [...collectMuxAssetIds(player)];
  for (const upload of muxUploads ?? []) {
    if (upload.asset_id) assetIds.push(upload.asset_id);
  }
  if (assetIds.length > 0) await Promise.allSettled(assetIds.map((assetId) => deleteMuxAsset(assetId)));

  const files = await listStorageFiles(user.id).catch(() => []);
  for (let index = 0; index < files.length; index += 100) {
    await admin.storage.from("player-images").remove(files.slice(index, index + 100));
  }

  if (player?.custom_domain) {
    try {
      await disableManagedDomainRenewal(player.custom_domain);
    } catch (domainError) {
      console.error("Managed domain cleanup failed", domainError);
      return NextResponse.json({ error: "Domain cleanup failed. Try again or contact support." }, { status: 502 });
    }
  }

  if (player?.stripe_customer_id) {
    try {
      await getStripe().customers.del(player.stripe_customer_id);
    } catch (stripeError) {
      console.error("Stripe customer cleanup failed", stripeError);
      return NextResponse.json({ error: "Billing cleanup failed. Try again or contact support." }, { status: 502 });
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return NextResponse.json({ error: "Account deletion failed. Contact support for help." }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
