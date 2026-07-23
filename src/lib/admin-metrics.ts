import "server-only";
import type Stripe from "stripe";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isEntitled } from "@/lib/stripe";

type AdminPlayerRow = {
  id: string;
  user_id: string;
  slug: string;
  first_name: string;
  last_name: string;
  billing_tier: "free" | "pro" | "elite";
  subscription_status: string;
  stripe_customer_id: string | null;
  is_published: boolean;
  has_custom_domain: boolean;
  custom_domain: string | null;
  custom_domain_status: string | null;
  mux_upload_count: number;
  created_at: string;
  updated_at: string;
};

type AnalyticsRow = {
  player_id: string;
  day: string;
  profile_views: number;
  video_plays: number;
};

type MuxUploadRow = {
  status: string;
  asset_id: string | null;
  created_at: string;
};

async function collectStripePages<T extends { id: string }>(
  fetchPage: (startingAfter?: string) => Promise<Stripe.ApiList<T>>,
  maxItems = 2000,
) {
  const items: T[] = [];
  let startingAfter: string | undefined;
  while (items.length < maxItems) {
    const page = await fetchPage(startingAfter);
    items.push(...page.data);
    if (!page.has_more || page.data.length === 0) break;
    startingAfter = page.data.at(-1)?.id;
  }
  return items.slice(0, maxItems);
}

async function collectAuthUsers(admin: ReturnType<typeof createAdminClient>) {
  const users: User[] = [];
  const perPage = 1000;
  for (let page = 1; page <= 100; page += 1) {
    const result = await admin.auth.admin.listUsers({ page, perPage });
    if (result.error) throw result.error;
    users.push(...result.data.users);
    if (result.data.users.length < perPage || (result.data.total > 0 && users.length >= result.data.total)) break;
  }
  return users;
}

function monthlyAmount(item: Stripe.SubscriptionItem) {
  const recurring = item.price.recurring;
  const amount = (item.price.unit_amount || 0) * (item.quantity || 1);
  if (!recurring) return 0;
  const intervalCount = recurring.interval_count || 1;
  if (recurring.interval === "year") return amount / (12 * intervalCount);
  if (recurring.interval === "week") return amount * (52 / 12) / intervalCount;
  if (recurring.interval === "day") return amount * (365 / 12) / intervalCount;
  return amount / intervalCount;
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
}

export type AdminUserSummary = {
  id: string;
  email: string;
  name: string;
  slug: string;
  tier: "free" | "pro" | "elite";
  subscriptionStatus: string;
  published: boolean;
  domain: string;
  domainStatus: string;
  views: number;
  videoPlays: number;
  joinedAt: string;
  updatedAt: string;
};

export async function getAdminMetrics() {
  const admin = createAdminClient();
  const analyticsSince = new Date();
  analyticsSince.setUTCDate(analyticsSince.getUTCDate() - 89);
  const analyticsStart = analyticsSince.toISOString().slice(0, 10);

  const [
    { data: playersData, error: playersError },
    { data: analyticsData, error: analyticsError },
    { data: muxData, error: muxError },
    authUsers,
  ] = await Promise.all([
    admin.from("players").select("id,user_id,slug,first_name,last_name,billing_tier,subscription_status,stripe_customer_id,is_published,has_custom_domain,custom_domain,custom_domain_status,mux_upload_count,created_at,updated_at"),
    admin.from("portfolio_analytics_daily").select("player_id,day,profile_views,video_plays").gte("day", analyticsStart),
    admin.from("mux_uploads").select("status,asset_id,created_at"),
    collectAuthUsers(admin),
  ]);
  if (playersError) throw playersError;
  if (analyticsError) throw analyticsError;
  if (muxError) throw muxError;

  const players = (playersData ?? []) as AdminPlayerRow[];
  const analytics = (analyticsData ?? []) as AnalyticsRow[];
  const muxUploads = (muxData ?? []) as MuxUploadRow[];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
  const thirtyDayKey = thirtyDaysAgo.toISOString().slice(0, 10);
  const analytics30 = analytics.filter((row) => row.day >= thirtyDayKey);
  const analyticsByPlayer = new Map<string, { views: number; videoPlays: number }>();
  for (const row of analytics30) {
    const current = analyticsByPlayer.get(row.player_id) || { views: 0, videoPlays: 0 };
    current.views += Number(row.profile_views);
    current.videoPlays += Number(row.video_plays);
    analyticsByPlayer.set(row.player_id, current);
  }

  const dailyAnalytics = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(thirtyDaysAgo);
    date.setUTCDate(thirtyDaysAgo.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    const rows = analytics30.filter((row) => row.day === key);
    return {
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      views: rows.reduce((sum, row) => sum + Number(row.profile_views), 0),
      videoPlays: rows.reduce((sum, row) => sum + Number(row.video_plays), 0),
    };
  });

  let subscriptions: Stripe.Subscription[] = [];
  let customers: Stripe.Customer[] = [];
  let invoices: Stripe.Invoice[] = [];
  let stripeError: string | null = null;
  try {
    const stripe = getStripe();
    const invoiceStart = new Date();
    invoiceStart.setUTCMonth(invoiceStart.getUTCMonth() - 5, 1);
    invoiceStart.setUTCHours(0, 0, 0, 0);
    [subscriptions, customers, invoices] = await Promise.all([
      collectStripePages((startingAfter) => stripe.subscriptions.list({ status: "all", limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) })),
      collectStripePages((startingAfter) => stripe.customers.list({ limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) })),
      collectStripePages((startingAfter) => stripe.invoices.list({ created: { gte: Math.floor(invoiceStart.getTime() / 1000) }, limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) })),
    ]);
  } catch (error) {
    stripeError = error instanceof Error ? error.message : "Stripe metrics could not be loaded.";
  }

  const entitledSubscriptions = subscriptions.filter((subscription) => isEntitled(subscription.status));
  const activeCustomerIds = new Set(entitledSubscriptions.map((subscription) =>
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id
  ));
  const mrrCents = entitledSubscriptions.reduce(
    (sum, subscription) => sum + subscription.items.data.reduce((subtotal, item) => subtotal + monthlyAmount(item), 0),
    0,
  );
  const nowSeconds = Math.floor(Date.now() / 1000);
  const canceledSince = nowSeconds - 30 * 24 * 60 * 60;
  const canceled30 = subscriptions.filter((subscription) =>
    subscription.status === "canceled" && (subscription.canceled_at || 0) >= canceledSince
  ).length;
  const scheduledCancellation = entitledSubscriptions.filter((subscription) => subscription.cancel_at_period_end).length;
  const churnRate = activeCustomerIds.size + canceled30 > 0
    ? (canceled30 / (activeCustomerIds.size + canceled30)) * 100
    : 0;

  const sixMonthKeys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setUTCMonth(date.getUTCMonth() - (5 - index), 1);
    return monthKey(date);
  });
  const revenueByMonth = new Map(sixMonthKeys.map((key) => [key, 0]));
  for (const invoice of invoices) {
    if (invoice.status !== "paid") continue;
    const key = monthKey(new Date(invoice.created * 1000));
    if (revenueByMonth.has(key)) revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + invoice.amount_paid);
  }
  const monthlyRevenue = sixMonthKeys.map((key) => ({ label: monthLabel(key), cents: revenueByMonth.get(key) || 0 }));
  const currentMonthRevenueCents = monthlyRevenue.at(-1)?.cents || 0;

  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const recentInvoices = invoices
    .filter((invoice) => invoice.status === "paid")
    .sort((a, b) => b.created - a.created)
    .slice(0, 10)
    .map((invoice) => {
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      const customer = customerId ? customerById.get(customerId) : undefined;
      return {
        id: invoice.id,
        email: invoice.customer_email || customer?.email || "Unknown customer",
        amountCents: invoice.amount_paid,
        createdAt: new Date(invoice.created * 1000).toISOString(),
        number: invoice.number || invoice.id.slice(-8),
      };
    });

  const playerByUser = new Map(players.map((player) => [player.user_id, player]));
  const users: AdminUserSummary[] = authUsers
    .map((authUser) => {
      const player = playerByUser.get(authUser.id);
      if (!player) {
        const metadataName = typeof authUser.user_metadata?.full_name === "string"
          ? authUser.user_metadata.full_name
          : "No portfolio yet";
        return {
          id: authUser.id,
          email: authUser.email || "No email",
          name: metadataName,
          slug: "",
          tier: "free" as const,
          subscriptionStatus: "not started",
          published: false,
          domain: "",
          domainStatus: "none",
          views: 0,
          videoPlays: 0,
          joinedAt: authUser.created_at,
          updatedAt: authUser.created_at,
        };
      }
      const engagement = analyticsByPlayer.get(player.id) || { views: 0, videoPlays: 0 };
      return {
        id: player.user_id,
        email: authUser.email || "No email",
        name: [player.first_name, player.last_name].filter(Boolean).join(" ") || "Unnamed player",
        slug: player.slug,
        tier: player.billing_tier || "free",
        subscriptionStatus: player.subscription_status || "inactive",
        published: player.is_published,
        domain: player.custom_domain || "",
        domainStatus: player.custom_domain_status || "none",
        views: engagement.views,
        videoPlays: engagement.videoPlays,
        joinedAt: player.created_at,
        updatedAt: player.updated_at,
      };
    })
    .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());

  const totalViews = analytics30.reduce((sum, row) => sum + Number(row.profile_views), 0);
  const totalVideoPlays = analytics30.reduce((sum, row) => sum + Number(row.video_plays), 0);
  const paidPlayers = players.filter((player) =>
    player.billing_tier === "pro" || player.billing_tier === "elite" || player.has_custom_domain
  ).length;
  const totalUsers = authUsers.length;

  return {
    stripeError,
    mrrCents,
    currentMonthRevenueCents,
    activeCustomers: activeCustomerIds.size,
    averageRevenuePerCustomerCents: activeCustomerIds.size ? mrrCents / activeCustomerIds.size : 0,
    canceled30,
    scheduledCancellation,
    churnRate,
    totalUsers,
    portfolioCount: players.length,
    publishedProfiles: players.filter((player) => player.is_published).length,
    paidPlayers,
    conversionRate: totalUsers ? (paidPlayers / totalUsers) * 100 : 0,
    planCounts: {
      free: players.filter((player) => player.billing_tier === "free").length,
      pro: players.filter((player) => player.billing_tier === "pro").length,
      elite: players.filter((player) => player.billing_tier === "elite").length,
      domain: players.filter((player) => player.has_custom_domain).length,
    },
    domainCounts: {
      active: players.filter((player) => player.custom_domain_status === "active").length,
      purchasing: players.filter((player) => player.custom_domain_status === "purchasing").length,
      failed: players.filter((player) => player.custom_domain_status === "failed").length,
      canceled: players.filter((player) => player.custom_domain_status === "canceled").length,
    },
    muxCounts: {
      initiated: players.reduce((sum, player) => sum + Number(player.mux_upload_count || 0), 0),
      tracked: muxUploads.length,
      ready: muxUploads.filter((upload) => upload.status === "ready").length,
      processing: muxUploads.filter((upload) => !["ready", "errored"].includes(upload.status)).length,
      errored: muxUploads.filter((upload) => upload.status === "errored").length,
    },
    totalViews,
    totalVideoPlays,
    dailyAnalytics,
    monthlyRevenue,
    recentInvoices,
    users,
  };
}
