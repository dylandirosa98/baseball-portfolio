import "server-only";
import { getStripe, getStripeMode } from "@/lib/stripe";

export const PARTNER_CATALOG = {
  partnerPro: { env: "STRIPE_PARTNER_PRO_PRICE_ID", key: "diamond_partner_pro_v1", name: "Diamond Profile Partner Pro License", cents: 800 },
  partnerElite: { env: "STRIPE_PARTNER_ELITE_PRICE_ID", key: "diamond_partner_elite_v1", name: "Diamond Profile Partner Elite License", cents: 1200 },
  whiteLabelBase: { env: "STRIPE_WHITE_LABEL_BASE_PRICE_ID", key: "diamond_white_label_base_v1", name: "Diamond Profile White Label Platform", cents: 20000 },
  whiteLabelPro: { env: "STRIPE_WHITE_LABEL_PRO_PRICE_ID", key: "diamond_white_label_pro_v1", name: "Diamond Profile White Label Pro License", cents: 400 },
  whiteLabelElite: { env: "STRIPE_WHITE_LABEL_ELITE_PRICE_ID", key: "diamond_white_label_elite_v1", name: "Diamond Profile White Label Elite License", cents: 600 },
  domain: { env: "STRIPE_PARTNER_DOMAIN_PRICE_ID", key: "diamond_partner_domain_v1", name: "Diamond Profile Partner Managed Domain", cents: 1800 },
} as const;

export type PartnerCatalogName = keyof typeof PARTNER_CATALOG;
let cached: Partial<Record<PartnerCatalogName, string>> | null = null;

export async function getPartnerCatalogPriceIds() {
  if (cached && Object.keys(cached).length === Object.keys(PARTNER_CATALOG).length) return cached as Record<PartnerCatalogName, string>;
  const stripe = getStripe();
  const mode = getStripeMode();
  const result: Partial<Record<PartnerCatalogName, string>> = {};
  const products = await stripe.products.list({ active: true, limit: 100 });

  for (const [name, item] of Object.entries(PARTNER_CATALOG) as Array<[PartnerCatalogName, (typeof PARTNER_CATALOG)[PartnerCatalogName]]>) {
    const configured = process.env[item.env];
    if (configured) {
      result[name] = configured;
      continue;
    }
    const existing = await stripe.prices.list({ lookup_keys: [item.key], active: true, limit: 1 });
    let price = existing.data[0];
    if (!price) {
      let product = products.data.find((candidate) => candidate.metadata.diamond_catalog_key === item.key);
      if (!product) {
        product = await stripe.products.create({
          name: item.name,
          metadata: { diamond_catalog_key: item.key, billing_kind: "partner_wholesale" },
        }, { idempotencyKey: `${item.key}_${mode}_product` });
        products.data.push(product);
      }
      price = await stripe.prices.create({
        product: product.id,
        currency: "usd",
        unit_amount: item.cents,
        recurring: { interval: "month" },
        lookup_key: item.key,
        transfer_lookup_key: true,
        nickname: item.name,
        metadata: { billing_kind: "partner_wholesale", catalog_key: item.key },
      }, { idempotencyKey: `${item.key}_${mode}_price` });
    }
    if (price.unit_amount !== item.cents || price.recurring?.interval !== "month") {
      throw new Error(`Stripe catalog item ${item.key} has unexpected billing terms.`);
    }
    result[name] = price.id;
  }
  cached = result;
  return result as Record<PartnerCatalogName, string>;
}

export function catalogKindFromPrice(price: { id: string; lookup_key?: string | null }, configured: Record<PartnerCatalogName, string>) {
  const match = (Object.entries(PARTNER_CATALOG) as Array<[PartnerCatalogName, (typeof PARTNER_CATALOG)[PartnerCatalogName]]>)
    .find(([name, item]) => price.id === configured[name] || price.lookup_key === item.key);
  if (!match) return null;
  if (match[0] === "whiteLabelBase") return "base" as const;
  if (match[0] === "partnerPro" || match[0] === "whiteLabelPro") return "pro" as const;
  if (match[0] === "partnerElite" || match[0] === "whiteLabelElite") return "elite" as const;
  return "domain" as const;
}
