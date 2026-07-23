import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleGauge,
  ExternalLink,
  Film,
  Globe2,
  ImageIcon,
  LayoutDashboard,
  LockKeyhole,
  PencilLine,
  Rocket,
  Settings,
  ShieldCheck,
  Video,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { BILLING_LIMITS, portfolioUsage, type BillingTier } from "@/lib/billing";
import { rowToPlayer, type PlayerRow } from "@/lib/supabase/transforms";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import DeleteAccountButton from "@/components/DeleteAccountButton";

export const dynamic = "force-dynamic";

type DashboardPlayerRow = PlayerRow & {
  subscription_status: string;
  subscription_current_period_end: string | null;
  subscription_cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  custom_domain_status: "none" | "purchasing" | "active" | "failed" | "canceled" | null;
  custom_domain_error: string | null;
};

function planName(tier: BillingTier) {
  return tier === "elite" ? "Elite" : tier === "pro" ? "Pro" : "Free";
}

function formatLimit(limit: number) {
  return Number.isFinite(limit) ? limit.toString() : "Unlimited";
}

function percent(used: number, limit: number) {
  if (!Number.isFinite(limit)) return Math.min(100, used > 0 ? 18 + Math.log2(used + 1) * 12 : 0);
  if (limit <= 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

function adminAllowed(email?: string) {
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && allowed.includes(email.toLowerCase()));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: rawPlayer } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const playerRow = rawPlayer as DashboardPlayerRow | null;
  const player = playerRow ? rowToPlayer(playerRow) : null;
  const tier = (playerRow?.billing_tier || "free") as BillingTier;
  const analyticsEnabled = tier === "pro" || tier === "elite";
  const usage = player ? portfolioUsage(player) : { images: 0, embeddedVideos: 0, muxVideos: 0 };
  const limits = BILLING_LIMITS[tier];
  const hostedUploadUsage = playerRow?.mux_upload_count ?? usage.muxVideos;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 29);
  const analyticsStart = since.toISOString().slice(0, 10);
  const { data: analyticsRows } = analyticsEnabled && playerRow?.id
    ? await supabase
        .from("portfolio_analytics_daily")
        .select("day, profile_views, video_plays")
        .eq("player_id", playerRow.id)
        .gte("day", analyticsStart)
        .order("day")
    : { data: [] };

  const byDay = new Map(
    (analyticsRows ?? []).map((row) => [
      row.day,
      { views: Number(row.profile_views), videoPlays: Number(row.video_plays) },
    ]),
  );
  const analyticsPoints = Array.from({ length: 30 }, (_, index) => {
    const day = new Date(since);
    day.setUTCDate(since.getUTCDate() + index);
    const key = day.toISOString().slice(0, 10);
    const value = byDay.get(key) ?? { views: 0, videoPlays: 0 };
    return {
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      ...value,
    };
  });
  const profileViews = analyticsPoints.reduce((sum, item) => sum + item.views, 0);
  const videoPlays = analyticsPoints.reduce((sum, item) => sum + item.videoPlays, 0);
  const activeDays = analyticsPoints.filter((item) => item.views > 0 || item.videoPlays > 0).length;

  async function manageBilling() {
    "use server";
    const client = await createClient();
    const { data: { user: billingUser } } = await client.auth.getUser();
    if (!billingUser) redirect("/auth");
    const { data: billingPlayer } = await client
      .from("players")
      .select("stripe_customer_id")
      .eq("user_id", billingUser.id)
      .maybeSingle();
    if (!billingPlayer?.stripe_customer_id) redirect("/dashboard");
    const session = await getStripe().billingPortal.sessions.create({
      customer: billingPlayer.stripe_customer_id,
      return_url: getAppUrl() + "/dashboard",
    });
    redirect(session.url);
  }

  async function signOut() {
    "use server";
    const client = await createClient();
    await client.auth.signOut();
    redirect("/");
  }

  const usageRows = [
    { label: "Portfolio images", icon: ImageIcon, used: usage.images, limit: limits.images },
    { label: "Embedded videos", icon: Video, used: usage.embeddedVideos, limit: limits.embeddedVideos },
    { label: "Hosted videos", icon: Film, used: hostedUploadUsage, limit: limits.muxVideos },
  ];
  const domainStatus = playerRow?.custom_domain_status || (playerRow?.has_custom_domain ? "active" : "none");
  const liveUrl = playerRow?.custom_domain && domainStatus === "active"
    ? "https://" + playerRow.custom_domain
    : playerRow?.slug
      ? getAppUrl() + "/" + playerRow.slug
      : null;

  return (
    <main className="min-h-screen bg-[#071018] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#09131c] px-5 py-6 lg:flex">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/diamond-profile-logo.png" alt="" width={52} height={52} className="h-11 w-11 object-contain" />
            <span className="text-sm font-black uppercase tracking-[0.12em]">Diamond Profile</span>
          </Link>
          <nav className="mt-10 space-y-1 text-sm">
            <span className="flex min-h-11 items-center gap-3 rounded-lg bg-[#ff5a2f] px-3 font-bold text-white">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </span>
            <Link href="/builder" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-white/55 transition hover:bg-white/5 hover:text-white">
              <PencilLine className="h-4 w-4" /> Edit portfolio
            </Link>
            {liveUrl && (
              <a href={liveUrl} target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-white/55 transition hover:bg-white/5 hover:text-white">
                <ExternalLink className="h-4 w-4" /> View live site
              </a>
            )}
            {adminAllowed(user.email) && (
              <Link href="/admin" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-white/55 transition hover:bg-white/5 hover:text-white">
                <ShieldCheck className="h-4 w-4" /> Admin
              </Link>
            )}
          </nav>
          <div className="mt-auto border-t border-white/10 pt-5">
            <p className="truncate text-xs font-semibold text-white/70">{user.email}</p>
            <p className="mt-1 text-[11px] text-white/30">{planName(tier)} account</p>
            <form action={signOut}>
              <button className="mt-4 min-h-10 text-xs font-semibold text-white/40 hover:text-white">Sign out</button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-white/10 bg-[#071018]/90 px-4 py-4 backdrop-blur-xl sm:px-7 lg:px-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8a69]">Player command center</p>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                  {player ? `${player.firstName || "Your"} ${player.lastName || "portfolio"}` : "Welcome to Diamond Profile"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/builder" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-[#071018]">
                  <PencilLine className="h-4 w-4" /> <span className="hidden sm:inline">Edit site</span>
                </Link>
                {liveUrl && (
                  <a href={liveUrl} target="_blank" rel="noreferrer" aria-label="Open live portfolio" className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 text-white/65 hover:text-white">
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </header>

          <div className="space-y-6 px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
            {!player ? (
              <section className="overflow-hidden rounded-2xl border border-[#ff5a2f]/30 bg-[linear-gradient(135deg,#172533,#0c1720)] p-6 sm:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8a69]">First step</p>
                <h2 className="mt-3 max-w-xl text-3xl font-black sm:text-5xl">Build the player page coaches will remember.</h2>
                <p className="mt-4 max-w-lg leading-7 text-white/55">Add the essentials, choose a design, upload your best work, and publish one clean recruiting link.</p>
                <Link href="/builder" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#ff5a2f] px-5 font-bold">
                  Start building <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            ) : (
              <>
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <article className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-white/40">Portfolio status</span>
                      <Rocket className="h-4 w-4 text-[#ff8a69]" />
                    </div>
                    <p className="mt-6 text-2xl font-black">{playerRow?.is_published ? "Published" : "Draft"}</p>
                    <p className="mt-1 truncate text-xs text-white/35">{playerRow?.slug ? `diamondprofile.app/${playerRow.slug}` : "No address selected"}</p>
                  </article>
                  <article className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-white/40">Current plan</span>
                      <CircleGauge className="h-4 w-4 text-[#f4c95d]" />
                    </div>
                    <p className="mt-6 text-2xl font-black">{planName(tier)}</p>
                    <p className="mt-1 text-xs capitalize text-white/35">{playerRow?.subscription_status || "No paid subscription"}</p>
                  </article>
                  <article className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-white/40">30-day views</span>
                      <BarChart3 className="h-4 w-4 text-[#7dd3fc]" />
                    </div>
                    <p className="mt-6 text-2xl font-black">{analyticsEnabled ? profileViews.toLocaleString() : "Locked"}</p>
                    <p className="mt-1 text-xs text-white/35">{analyticsEnabled ? `${activeDays} active days` : "Available on paid plans"}</p>
                  </article>
                  <article className="rounded-xl border border-white/10 bg-white/[0.035] p-5">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-white/40">Custom domain</span>
                      <Globe2 className="h-4 w-4 text-[#a7f3d0]" />
                    </div>
                    <p className="mt-6 truncate text-lg font-black capitalize">{domainStatus === "none" ? "Not connected" : domainStatus}</p>
                    <p className="mt-1 truncate text-xs text-white/35">{playerRow?.custom_domain || "$10/month add-on"}</p>
                  </article>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
                  <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1721] p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8a69]">Performance</p>
                        <h2 className="mt-2 text-xl font-black">Last 30 days</h2>
                      </div>
                      <div className="flex gap-5 text-xs">
                        <span><strong className="block text-lg text-[#ff8a69]">{analyticsEnabled ? profileViews : "—"}</strong><span className="text-white/35">Views</span></span>
                        <span><strong className="block text-lg text-[#f4c95d]">{analyticsEnabled ? videoPlays : "—"}</strong><span className="text-white/35">Video plays</span></span>
                      </div>
                    </div>
                    <div className="mt-8">
                      <AnalyticsChart points={analyticsEnabled ? analyticsPoints : analyticsPoints.map((point) => ({ ...point, views: 0, videoPlays: 0 }))} />
                    </div>
                    {!analyticsEnabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0b1721]/82 p-6 backdrop-blur-[3px]">
                        <div className="max-w-sm text-center">
                          <LockKeyhole className="mx-auto h-7 w-7 text-[#f4c95d]" />
                          <h3 className="mt-4 text-xl font-black">Analytics unlock with Pro</h3>
                          <p className="mt-2 text-sm leading-6 text-white/50">See profile views, video plays, and daily performance once you upgrade to Pro or Elite.</p>
                          <Link href="/builder" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-[#071018]">
                            View plans <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="rounded-2xl border border-white/10 bg-[#0b1721] p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8a69]">Plan usage</p><h2 className="mt-2 text-xl font-black">{planName(tier)}</h2></div>
                      <Settings className="h-5 w-5 text-white/25" />
                    </div>
                    <div className="mt-7 space-y-6">
                      {usageRows.map(({ label, icon: Icon, used, limit }) => (
                        <div key={label}>
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="flex items-center gap-2 font-semibold text-white/65"><Icon className="h-3.5 w-3.5" />{label}</span>
                            <span className="text-white/35">{used} / {formatLimit(limit)}</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-[#ff5a2f]" style={{ width: `${percent(used, limit)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link href="/builder" className="mt-7 flex min-h-11 items-center justify-between border-t border-white/10 pt-5 text-sm font-bold text-white/65 hover:text-white">
                      Manage content <ArrowRight className="h-4 w-4" />
                    </Link>
                  </section>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8a69]">Website</p>
                        <h2 className="mt-2 text-xl font-black">Your recruiting link</h2>
                      </div>
                      <CheckCircle2 className={`h-5 w-5 ${playerRow?.is_published ? "text-emerald-300" : "text-white/20"}`} />
                    </div>
                    <p className="mt-5 break-all rounded-lg border border-white/10 bg-black/20 px-4 py-3 font-mono text-sm text-white/65">
                      {liveUrl || "Choose an address in the builder"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href="/builder" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-[#071018]"><PencilLine className="h-4 w-4" /> Edit portfolio</Link>
                      {liveUrl && <a href={liveUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-bold">Open site <ArrowUpRight className="h-4 w-4" /></a>}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8a69]">Domain</p>
                        <h2 className="mt-2 text-xl font-black">{playerRow?.custom_domain || "Use your own .com"}</h2>
                      </div>
                      <Globe2 className="h-5 w-5 text-white/25" />
                    </div>
                    <p className="mt-5 text-sm leading-6 text-white/45">
                      {domainStatus === "active"
                        ? "Connected and managed by Diamond Profile. Renewal stays active while the domain add-on is subscribed."
                        : domainStatus === "purchasing"
                          ? "Your domain is being purchased and connected. This normally completes shortly."
                          : domainStatus === "failed"
                            ? "The domain could not be provisioned automatically. Support has the failure details."
                            : "We purchase, connect, and renew one standard .com for $10 per month."}
                    </p>
                    {domainStatus === "failed" && playerRow?.custom_domain_error && (
                      <p className="mt-3 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">{playerRow.custom_domain_error}</p>
                    )}
                    {!playerRow?.has_custom_domain && (
                      <Link href="/builder" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-bold">
                        Add a custom domain <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </section>
                </div>
              </>
            )}

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/30">Account & billing</p>
                  <p className="mt-2 text-sm text-white/60">{user.email}</p>
                  {playerRow?.subscription_current_period_end && (
                    <p className="mt-1 text-xs text-white/30">
                      {playerRow.subscription_cancel_at_period_end ? "Access ends" : "Next billing period"}{" "}
                      {new Date(playerRow.subscription_current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {playerRow?.stripe_customer_id && (
                    <form action={manageBilling}>
                      <button className="min-h-11 rounded-lg border border-white/15 px-4 text-sm font-bold hover:bg-white/5">Manage billing</button>
                    </form>
                  )}
                  <form action={signOut}>
                    <button className="min-h-11 rounded-lg border border-white/10 px-4 text-sm font-semibold text-white/45 hover:text-white">Sign out</button>
                  </form>
                </div>
              </div>
              <DeleteAccountButton />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
