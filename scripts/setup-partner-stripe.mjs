import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("STRIPE_SECRET_KEY is required.");
const live = secretKey.startsWith("sk_live_");
if (!live && !secretKey.startsWith("sk_test_") && !secretKey.startsWith("rk_test_")) {
  throw new Error("Use a Stripe test or live secret key.");
}

const stripe = new Stripe(secretKey);
const catalog = [
  { env: "STRIPE_PARTNER_PRO_PRICE_ID", key: "diamond_partner_pro_v1", name: "Diamond Profile Partner Pro License", cents: 800, description: "Monthly wholesale Pro athlete license for standard partners." },
  { env: "STRIPE_PARTNER_ELITE_PRICE_ID", key: "diamond_partner_elite_v1", name: "Diamond Profile Partner Elite License", cents: 1200, description: "Monthly wholesale Elite athlete license for standard partners." },
  { env: "STRIPE_WHITE_LABEL_BASE_PRICE_ID", key: "diamond_white_label_base_v1", name: "Diamond Profile White Label Platform", cents: 20000, description: "Monthly white-label platform subscription." },
  { env: "STRIPE_WHITE_LABEL_PRO_PRICE_ID", key: "diamond_white_label_pro_v1", name: "Diamond Profile White Label Pro License", cents: 400, description: "Monthly wholesale Pro athlete license for white-label partners." },
  { env: "STRIPE_WHITE_LABEL_ELITE_PRICE_ID", key: "diamond_white_label_elite_v1", name: "Diamond Profile White Label Elite License", cents: 600, description: "Monthly wholesale Elite athlete license for white-label partners." },
  { env: "STRIPE_PARTNER_DOMAIN_PRICE_ID", key: "diamond_partner_domain_v1", name: "Diamond Profile Partner Managed Domain", cents: 1800, description: "Monthly managed-domain wholesale charge for partner athletes." },
];

const products = await stripe.products.list({ active: true, limit: 100 });
for (const item of catalog) {
  let product = products.data.find((candidate) => candidate.metadata.diamond_catalog_key === item.key);
  if (!product) {
    product = await stripe.products.create({
      name: item.name,
      description: item.description,
      metadata: { diamond_catalog_key: item.key, billing_kind: "partner_wholesale" },
    }, { idempotencyKey: `${item.key}_${live ? "live" : "test"}_product` });
  }
  const existing = await stripe.prices.list({ lookup_keys: [item.key], active: true, limit: 1 });
  const price = existing.data[0] || await stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: item.cents,
    recurring: { interval: "month" },
    lookup_key: item.key,
    transfer_lookup_key: true,
    nickname: item.name,
    metadata: { billing_kind: "partner_wholesale", catalog_key: item.key },
  }, { idempotencyKey: `${item.key}_${live ? "live" : "test"}_price` });
  if (price.unit_amount !== item.cents || price.recurring?.interval !== "month") {
    throw new Error(`${item.key} exists with unexpected billing terms.`);
  }
  console.log(`${item.env}=${price.id}`);
}
