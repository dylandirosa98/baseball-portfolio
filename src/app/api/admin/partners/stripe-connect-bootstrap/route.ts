import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/admin-auth";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { getPartnerCatalogPriceIds } from "@/lib/partner-stripe-catalog";

export const runtime = "nodejs";

async function authorized(request: NextRequest) {
  const bootstrapToken = process.env.PARTNER_BOOTSTRAP_TOKEN;
  const suppliedToken = request.headers.get("x-bootstrap-token");
  if (bootstrapToken && suppliedToken && suppliedToken.length === bootstrapToken.length) {
    if (timingSafeEqual(Buffer.from(bootstrapToken), Buffer.from(suppliedToken))) return true;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return Boolean(user && isPlatformAdmin(user.email));
}

async function installVercelSecret(secret: string) {
  const token = process.env.VERCEL_API_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID_OR_NAME;
  if (!token || !project) throw new Error("Vercel project credentials are not configured.");
  const url = new URL(`https://api.vercel.com/v10/projects/${encodeURIComponent(project)}/env`);
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  const response = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      key: "STRIPE_CONNECT_WEBHOOK_SECRET",
      value: secret,
      type: "sensitive",
      target: ["production"],
    }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(body.error?.message || `Vercel rejected the environment variable (${response.status}).`);
  }
}

export async function POST(request: NextRequest) {
  if (!(await authorized(request))) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (process.env.STRIPE_CONNECT_WEBHOOK_SECRET) {
    return NextResponse.json({ configured: true, created: false, needsRedeploy: false });
  }
  const stripe = getStripe();
  await getPartnerCatalogPriceIds();
  const url = `${getAppUrl()}/api/stripe/connect-webhook`;
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((endpoint) => endpoint.url === url && (endpoint as Stripe.WebhookEndpoint & { connect?: boolean }).connect === true);
  if (existing) {
    return NextResponse.json({ error: "A Connect webhook already exists but its secret is not installed. Reveal its signing secret in Stripe and add STRIPE_CONNECT_WEBHOOK_SECRET to Vercel." }, { status: 409 });
  }

  let endpoint: Stripe.WebhookEndpoint | null = null;
  try {
    endpoint = await stripe.webhookEndpoints.create({
      url,
      connect: true,
      description: "Diamond Profile partner subscription lifecycle",
      enabled_events: [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "account.updated",
        "account.application.deauthorized",
      ],
      metadata: { managed_by: "diamond_profile", purpose: "partner_subscriptions" },
    });
    if (!endpoint.secret) throw new Error("Stripe created the webhook without returning its signing secret.");
    await installVercelSecret(endpoint.secret);
    return NextResponse.json({ configured: true, created: true, endpointId: endpoint.id, needsRedeploy: true });
  } catch (error) {
    if (endpoint) await stripe.webhookEndpoints.del(endpoint.id).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Connect webhook setup failed." }, { status: 500 });
  }
}
