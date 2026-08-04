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

async function installVercelSecret(key: string, secret: string) {
  const token = process.env.VERCEL_API_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID_OR_NAME;
  if (!token || !project) throw new Error("Vercel project credentials are not configured.");
  const url = new URL(`https://api.vercel.com/v10/projects/${encodeURIComponent(project)}/env`);
  if (process.env.VERCEL_TEAM_ID) url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  const response = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      key,
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
  const stripe = getStripe();
  await getPartnerCatalogPriceIds();
  const snapshotUrl = `${getAppUrl()}/api/stripe/connect-webhook`;
  const thinUrl = `${getAppUrl()}/api/stripe/connect-v2-webhook`;
  let snapshotEndpoint: Stripe.WebhookEndpoint | null = null;
  let thinDestinationId: string | null = null;
  let createdSnapshot = false;
  let createdThin = false;
  try {
    if (!process.env.STRIPE_CONNECT_WEBHOOK_SECRET) {
      const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
      const existing = endpoints.data.find((endpoint) => endpoint.url === snapshotUrl && (endpoint as Stripe.WebhookEndpoint & { connect?: boolean }).connect === true);
      if (existing) throw new Error("The connected-payment webhook exists but its signing secret is not installed. Reveal it in Stripe and add STRIPE_CONNECT_WEBHOOK_SECRET to Vercel.");
      snapshotEndpoint = await stripe.webhookEndpoints.create({
        url: snapshotUrl,
        connect: true,
        description: "Diamond Profile partner subscription lifecycle",
        enabled_events: [
          "checkout.session.completed",
          "customer.subscription.created",
          "customer.subscription.updated",
          "customer.subscription.deleted",
        ],
        metadata: { managed_by: "diamond_profile", purpose: "partner_subscriptions" },
      });
      if (!snapshotEndpoint.secret) throw new Error("Stripe created the payments webhook without returning its signing secret.");
      createdSnapshot = true;
      await installVercelSecret("STRIPE_CONNECT_WEBHOOK_SECRET", snapshotEndpoint.secret);
    }

    if (!process.env.STRIPE_CONNECT_V2_WEBHOOK_SECRET) {
      for await (const destination of stripe.v2.core.eventDestinations.list({ limit: 100, include: ["webhook_endpoint.url"] })) {
        if (destination.event_payload === "thin" && destination.webhook_endpoint?.url === thinUrl) {
          thinDestinationId = destination.id;
          break;
        }
      }
      if (thinDestinationId) throw new Error("The V2 account webhook exists but its signing secret is not installed. Reveal it in Stripe and add STRIPE_CONNECT_V2_WEBHOOK_SECRET to Vercel.");
      const destination = await stripe.v2.core.eventDestinations.create({
        name: "Diamond Profile connected account status",
        description: "Requirements and payment capability changes for partner V2 Accounts",
        type: "webhook_endpoint",
        event_payload: "thin",
        events_from: ["@accounts"],
        enabled_events: [
          "v2.core.account[requirements].updated",
          "v2.core.account[configuration.merchant].capability_status_updated",
          "v2.core.account[configuration.customer].capability_status_updated",
          "v2.core.account.updated",
          "v2.core.account.closed",
        ],
        webhook_endpoint: { url: thinUrl },
        include: ["webhook_endpoint.signing_secret", "webhook_endpoint.url"],
        metadata: { managed_by: "diamond_profile", purpose: "partner_account_status" },
      });
      thinDestinationId = destination.id;
      createdThin = true;
      const secret = destination.webhook_endpoint?.signing_secret;
      if (!secret) throw new Error("Stripe created the V2 account webhook without returning its signing secret.");
      await installVercelSecret("STRIPE_CONNECT_V2_WEBHOOK_SECRET", secret);
    }

    const changed = createdSnapshot || createdThin;
    return NextResponse.json({ configured: true, createdSnapshot, createdThin, needsRedeploy: changed });
  } catch (error) {
    if (createdSnapshot && snapshotEndpoint) await stripe.webhookEndpoints.del(snapshotEndpoint.id).catch(() => undefined);
    if (createdThin && thinDestinationId) await stripe.v2.core.eventDestinations.del(thinDestinationId).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Connect webhook setup failed." }, { status: 500 });
  }
}
