import "server-only";

type DomainPrice = {
  purchasePrice: number;
  renewalPrice: number;
};

type DomainAvailability = {
  available: boolean;
};

type BuyDomainResult = {
  orderId?: string;
};

type DomainOrderResult = {
  orderId: string;
  status: "draft" | "purchasing" | "completed" | "failed";
  domains: Array<{
    domainName: string;
    status: "pending" | "completed" | "failed" | "refunded" | "refund-failed";
    price: number;
    error?: { code?: string };
  }>;
  error?: { code?: string };
};

class VercelApiError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
    this.name = "VercelApiError";
  }
}

export class ManagedDomainOrderFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManagedDomainOrderFailedError";
  }
}

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
  const result = await response.json().catch(() => ({})) as T & {
    code?: string;
    error?: { code?: string; message?: string };
    message?: string;
  };
  if (!response.ok) {
    throw new VercelApiError(
      result.error?.message || result.message || `Vercel request failed (${response.status}).`,
      result.error?.code || result.code,
    );
  }
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

export async function getDomainAvailability(domain: string) {
  const result = await vercelRequest<DomainAvailability>(
    `/v1/registrar/domains/${encodeURIComponent(domain)}/availability`,
  );
  if (!result || typeof result.available !== "boolean") throw new Error("Vercel did not return domain availability.");
  return result.available;
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

async function setManagedDomainRenewal(domain: string, autoRenew: boolean) {
  try {
    await vercelRequest(`/v1/registrar/domains/${encodeURIComponent(domain)}/auto-renew`, {
      method: "PATCH",
      body: JSON.stringify({ autoRenew }),
    });
  } catch (error) {
    const alreadyInRequestedState = error instanceof VercelApiError && (
      (autoRenew && error.code === "domain_already_renewing")
      || (!autoRenew && ["domain_already_not_renewing", "domain_not_renewing"].includes(error.code || ""))
    );
    if (!alreadyInRequestedState) throw error;
  }
}

export async function provisionManagedDomain(domain: string, existingOrderId?: string | null) {
  const attached = await isAttached(domain);
  const owned = await isOwned(domain);
  if (owned) {
    await setManagedDomainRenewal(domain, true);
    if (!attached) await attachDomain(domain);
    return { status: "active" as const, orderId: existingOrderId || null, purchasePrice: null };
  }

  if (existingOrderId) {
    const order = await vercelRequest<DomainOrderResult>(
      `/v1/registrar/orders/${encodeURIComponent(existingOrderId)}`,
    );
    const domainOrder = order?.domains.find((item) => item.domainName.toLowerCase() === domain);
    if (!order || !domainOrder) throw new Error("Vercel did not return the domain purchase in its order.");
    const terminalFailure = order.status === "failed" || ["failed", "refunded", "refund-failed"].includes(domainOrder.status);
    if (terminalFailure) {
      const code = domainOrder.error?.code || order.error?.code;
      throw new ManagedDomainOrderFailedError(`Vercel domain order failed${code ? ` (${code})` : ""}.`);
    }
    if (order.status !== "completed" || domainOrder.status !== "completed" || !(await isOwned(domain))) {
      return { status: "purchasing" as const, orderId: existingOrderId, purchasePrice: domainOrder.price };
    }
    await setManagedDomainRenewal(domain, true);
    await attachDomain(domain);
    return { status: "active" as const, orderId: existingOrderId, purchasePrice: domainOrder.price };
  }

  const price = await getDomainPrice(domain);
  if (price.purchasePrice > maximumDomainPrice()) {
    throw new ManagedDomainOrderFailedError(`The domain costs $${price.purchasePrice}, above the managed-domain purchase limit.`);
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
  if (!purchase?.orderId) throw new Error("Vercel accepted the purchase but did not return an order ID.");
  console.info("Managed domain order created", { domain, orderId: purchase.orderId });
  try {
    if (await isOwned(domain)) {
      await setManagedDomainRenewal(domain, true);
      await attachDomain(domain);
      return { status: "active" as const, orderId: purchase.orderId, purchasePrice: price.purchasePrice };
    }
  } catch (activationError) {
    console.warn("Managed domain order is awaiting reconciliation", { domain, orderId: purchase.orderId, activationError });
  }
  return { status: "purchasing" as const, orderId: purchase.orderId, purchasePrice: price.purchasePrice };
}

export async function disableManagedDomainRenewal(domain: string) {
  if (!(await isOwned(domain))) return;
  await setManagedDomainRenewal(domain, false);
}
