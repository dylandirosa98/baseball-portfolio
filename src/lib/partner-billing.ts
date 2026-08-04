import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import type { PartnerOrganizationRow } from "@/lib/partners";
import { getPartnerCatalogPriceIds } from "@/lib/partner-stripe-catalog";

type WholesaleKind = "base" | "pro" | "elite" | "domain";

export function partnerPlatformCostCents(organization: PartnerOrganizationRow, tier: "pro" | "elite") {
  return tier === "pro" ? organization.pro_wholesale_cents : organization.elite_wholesale_cents;
}

async function priceIds(organization: PartnerOrganizationRow) {
  const whiteLabel = organization.partnership_type === "white_label";
  const catalog = await getPartnerCatalogPriceIds();
  return {
    base: whiteLabel ? catalog.whiteLabelBase : "",
    pro: whiteLabel
      ? catalog.whiteLabelPro
      : catalog.partnerPro,
    elite: whiteLabel
      ? catalog.whiteLabelElite
      : catalog.partnerElite,
    domain: catalog.domain,
  };
}

function itemColumns(kind: WholesaleKind) {
  return {
    base: "platform_base_item_id",
    pro: "platform_pro_item_id",
    elite: "platform_elite_item_id",
    domain: "platform_domain_item_id",
  }[kind] as keyof PartnerOrganizationRow;
}

export async function partnerLicenseCounts(organizationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("players")
    .select("partner_plan, partner_billing_status, has_custom_domain, custom_domain_status")
    .eq("organization_id", organizationId);
  if (error) throw error;
  const active = (data ?? []).filter((player) =>
    ["trialing", "active", "past_due", "canceling"].includes(player.partner_billing_status)
  );
  return {
    pro: active.filter((player) => player.partner_plan === "pro").length,
    elite: active.filter((player) => player.partner_plan === "elite").length,
    domain: active.filter((player) => player.has_custom_domain && ["active", "purchasing"].includes(player.custom_domain_status)).length,
  };
}

async function recordSync(organizationId: string, values: Record<string, unknown>) {
  const { error } = await createAdminClient().from("partner_organizations").update(values).eq("id", organizationId);
  if (error) throw error;
}

export async function syncPartnerWholesaleBilling(organizationId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("partner_organizations").select("*").eq("id", organizationId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Partner organization was not found.");
  const organization = data as PartnerOrganizationRow;
  const counts = await partnerLicenseCounts(organizationId);
  const prices = await priceIds(organization);
  const desired: Array<{ kind: WholesaleKind; price: string; quantity: number }> = organization.status === "active" ? [
    ...(organization.partnership_type === "white_label" ? [{ kind: "base" as const, price: prices.base, quantity: 1 }] : []),
    { kind: "pro" as const, price: prices.pro, quantity: counts.pro },
    { kind: "elite" as const, price: prices.elite, quantity: counts.elite },
    { kind: "domain" as const, price: prices.domain, quantity: counts.domain },
  ].filter((item) => item.quantity > 0) : [];

  const missingPrice = desired.find((item) => !item.price);
  if (missingPrice) {
    const message = `Stripe wholesale price for ${missingPrice.kind} is not configured.`;
    await recordSync(organizationId, { billing_sync_error: message, billing_synced_at: new Date().toISOString() });
    throw new Error(message);
  }
  if (!organization.platform_stripe_customer_id) {
    const message = "Partner wholesale Stripe customer is not configured.";
    await recordSync(organizationId, { billing_sync_error: message, billing_synced_at: new Date().toISOString() });
    throw new Error(message);
  }

  const stripe = getStripe();
  let subscription: Stripe.Subscription | null = null;
  if (organization.platform_stripe_subscription_id) {
    try {
      subscription = await stripe.subscriptions.retrieve(organization.platform_stripe_subscription_id);
      if (subscription.status === "canceled") subscription = null;
    } catch {
      subscription = null;
    }
  }

  if (desired.length === 0) {
    if (subscription) await stripe.subscriptions.cancel(subscription.id);
    await recordSync(organizationId, {
      platform_stripe_subscription_id: null,
      platform_subscription_status: "inactive",
      platform_base_item_id: null,
      platform_pro_item_id: null,
      platform_elite_item_id: null,
      platform_domain_item_id: null,
      billing_sync_error: null,
      billing_synced_at: new Date().toISOString(),
    });
    return { counts, status: "inactive" };
  }

  try {
    if (!subscription) {
      const customer = await stripe.customers.retrieve(organization.platform_stripe_customer_id);
      if (customer.deleted || !customer.invoice_settings.default_payment_method) {
        throw new Error("Complete partner billing setup before activating paid athlete profiles.");
      }
      subscription = await stripe.subscriptions.create({
        customer: organization.platform_stripe_customer_id,
        items: desired.map((item) => ({ price: item.price, quantity: item.quantity })),
        collection_method: "charge_automatically",
        metadata: { kind: "partner_wholesale", organization_id: organizationId },
      });
    } else {
      const currentById = new Map(subscription.items.data.map((item) => [item.id, item]));
      const desiredKinds = new Set(desired.map((item) => item.kind));
      const updates: Stripe.SubscriptionUpdateParams.Item[] = [];

      for (const item of desired) {
        const storedId = organization[itemColumns(item.kind)] as string | null;
        const existing = storedId ? currentById.get(storedId) : subscription.items.data.find((line) => line.price.id === item.price);
        updates.push(existing
          ? { id: existing.id, quantity: item.quantity }
          : { price: item.price, quantity: item.quantity });
      }
      for (const kind of ["base", "pro", "elite", "domain"] as WholesaleKind[]) {
        if (desiredKinds.has(kind)) continue;
        const storedId = organization[itemColumns(kind)] as string | null;
        if (storedId && currentById.has(storedId)) updates.push({ id: storedId, deleted: true });
      }
      subscription = await stripe.subscriptions.update(subscription.id, {
        items: updates,
        proration_behavior: "none",
        metadata: { kind: "partner_wholesale", organization_id: organizationId },
      });
    }

    const itemId = (kind: WholesaleKind) => {
      const price = prices[kind];
      return subscription?.items.data.find((item) => item.price.id === price)?.id || null;
    };
    await recordSync(organizationId, {
      platform_stripe_subscription_id: subscription.id,
      platform_subscription_status: subscription.status,
      platform_base_item_id: itemId("base"),
      platform_pro_item_id: itemId("pro"),
      platform_elite_item_id: itemId("elite"),
      platform_domain_item_id: itemId("domain"),
      billing_sync_error: null,
      billing_synced_at: new Date().toISOString(),
    });
    return { counts, status: subscription.status };
  } catch (syncError) {
    const message = syncError instanceof Error ? syncError.message : "Wholesale billing synchronization failed.";
    await recordSync(organizationId, { billing_sync_error: message.slice(0, 1000), billing_synced_at: new Date().toISOString() });
    throw syncError;
  }
}
