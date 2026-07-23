import "server-only";

type DomainPrice = {
  purchasePrice: number;
  renewalPrice: number;
};

type BuyDomainResult = {
  orderId?: string;
};

function configuration() {
  const token = process.env.VERCEL_API_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID_OR_NAME;
  if (!token || !project) throw new Error("Vercel domain fulfillment is not configured.");
  return { token, project, teamId: process.env.VERCEL_TEAM_ID };
}

function apiUrl(path: string, teamId?: string) {
  const url = new URL("https://api.vercel.com" + path);
  if (teamId) url.searchParams.set("teamId", teamId);
  return url;
}

async function vercelRequest<T>(path: string, init: RequestInit = {}, allowNotFound = false): Promise<T | null> {
  const { token, teamId } = configuration();
  const response = await fetch(apiUrl(path, teamId), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (allowNotFound && response.status === 404) return null;
  const result = await response.json().catch(() => ({})) as T & { error?: { message?: string }; message?: string };
  if (!response.ok) throw new Error(result.error?.message || result.message || `Vercel request failed (${response.status}).`);
  return result;
}

function registrant() {
  const fields = {
    firstName: process.env.DOMAIN_REGISTRANT_FIRST_NAME,
    lastName: process.env.DOMAIN_REGISTRANT_LAST_NAME,
    email: process.env.DOMAIN_REGISTRANT_EMAIL,
    phone: process.env.DOMAIN_REGISTRANT_PHONE,
    address1: process.env.DOMAIN_REGISTRANT_ADDRESS1,
    city: process.env.DOMAIN_REGISTRANT_CITY,
    state: process.env.DOMAIN_REGISTRANT_STATE,
    zip: process.env.DOMAIN_REGISTRANT_ZIP,
    country: process.env.DOMAIN_REGISTRANT_COUNTRY,
  };
  if (Object.values(fields).some((value) => !value)) {
    throw new Error("Domain registrant contact information is incomplete.");
  }
  return {
    ...fields as Record<keyof typeof fields, string>,
    ...(process.env.DOMAIN_REGISTRANT_ADDRESS2 ? { address2: process.env.DOMAIN_REGISTRANT_ADDRESS2 } : {}),
    ...(process.env.DOMAIN_REGISTRANT_COMPANY ? { companyName: process.env.DOMAIN_REGISTRANT_COMPANY } : {}),
  };
}

export function maximumDomainPrice() {
  const configured = Number(process.env.DOMAIN_MAX_PURCHASE_PRICE_USD || "25");
  return Number.isFinite(configured) && configured > 0 ? configured : 25;
}

export async function getDomainPrice(domain: string) {
  const price = await vercelRequest<DomainPrice>(`/v1/registrar/domains/${encodeURIComponent(domain)}/price`);
  if (!price || !Number.isFinite(price.purchasePrice)) throw new Error("Vercel did not return a domain price.");
  return price;
}

async function isAttached(domain: string) {
  const { project } = configuration();
  return Boolean(await vercelRequest(
    `/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(domain)}`,
    {},
    true,
  ));
}

async function isOwned(domain: string) {
  return Boolean(await vercelRequest(`/v5/domains/${encodeURIComponent(domain)}`, {}, true));
}

async function attachDomain(domain: string) {
  const { project } = configuration();
  await vercelRequest(`/v10/projects/${encodeURIComponent(project)}/domains`, {
    method: "POST",
    body: JSON.stringify({ name: domain }),
  });
}

export async function provisionManagedDomain(domain: string) {
  if (await isAttached(domain)) return { orderId: null, purchasePrice: null };

  let orderId: string | null = null;
  let purchasePrice: number | null = null;
  if (!(await isOwned(domain))) {
    const price = await getDomainPrice(domain);
    if (price.purchasePrice > maximumDomainPrice()) {
      throw new Error(`The domain costs $${price.purchasePrice}, above the managed-domain purchase limit.`);
    }
    const purchase = await vercelRequest<BuyDomainResult>(
      `/v1/registrar/domains/${encodeURIComponent(domain)}/buy`,
      {
        method: "POST",
        body: JSON.stringify({
          autoRenew: true,
          years: 1,
          expectedPrice: price.purchasePrice,
          contactInformation: registrant(),
        }),
      },
    );
    orderId = purchase?.orderId || null;
    purchasePrice = price.purchasePrice;
  }

  await attachDomain(domain);
  return { orderId, purchasePrice };
}

export async function disableManagedDomainRenewal(domain: string) {
  if (!(await isOwned(domain))) return;
  await vercelRequest(`/v1/registrar/domains/${encodeURIComponent(domain)}/auto-renew`, {
    method: "PATCH",
    body: JSON.stringify({ autoRenew: false }),
  });
}
