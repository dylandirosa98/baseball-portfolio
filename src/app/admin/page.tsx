import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  CircleGauge,
  CreditCard,
  Film,
  Globe2,
  LayoutDashboard,
  ShieldCheck,
  TrendingDown,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAdminMetrics } from "@/lib/admin-metrics";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";
import AdminUserTable from "@/components/admin/AdminUserTable";

export const dynamic = "force-dynamic";

function dollars(cents: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits,
  }).format(cents / 100);
}

function allowedAdmin(email?: string) {
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && allowed.includes(email.toLowerCase()));
}

function MetricCard({ label, value, note, icon: Icon, tone = "orange" }: {
  label: string;
  value: string;
  note: string;
  icon: typeof CircleDollarSign;
  tone?: "orange" | "gold" | "blue" | "green";
}) {
  const toneClass = {
    orange: "bg-[#ff5a2f]/12 text-[#ff8a69]",
    gold: "bg-amber-300/10 text-amber-200",
    blue: "bg-sky-300/10 text-sky-200",
    green: "bg-emerald-300/10 text-emerald-200",
  }[tone];
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-white/40">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-5 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-white/30">{note}</p>
    </article>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  if (!allowedAdmin(user.email)) notFound();

  const metrics = await getAdminMetrics();
  const maxRevenue = Math.max(1, ...metrics.monthlyRevenue.map((month) => month.cents));
  const totalPlans = Math.max(1, metrics.portfolioCount);
  const planMix = [
    { label: "Free", count: metrics.planCounts.free, color: "bg-white/30" },
    { label: "Pro", count: metrics.planCounts.pro, color: "bg-[#ff5a2f]" },
    { label: "Elite", count: metrics.planCounts.elite, color: "bg-amber-300" },
    { label: "Domain add-on", count: metrics.planCounts.domain, color: "bg-sky-300" },
  ];

  return (
    <main className="min-h-screen bg-[#060d13] text-white">
      <header className="border-b border-white/10 bg-[#08121a]">
        <div className="mx-auto flex min-h-20 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <Image src="/diamond-profile-logo.png" alt="" width={48} height={48} className="h-10 w-10 object-contain" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff8a69]">Private operations</p>
              <h1 className="text-lg font-black">Diamond Profile Admin</h1>
            </div>
          </div>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-bold text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> User dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300"><ShieldCheck className="h-4 w-4" /> Read-only administration</div>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">Business command center</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">Revenue, customers, portfolio activity, media usage, and managed-domain health from Stripe and Supabase.</p>
          </div>
          <p className="text-xs text-white/30">Updated {new Date().toLocaleString()}</p>
        </section>

        {metrics.stripeError && (
          <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">
            Stripe metrics are unavailable: {metrics.stripeError}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Monthly recurring revenue" value={dollars(metrics.mrrCents)} note={`${metrics.activeCustomers} active paying customers`} icon={CircleDollarSign} />
          <MetricCard label="Revenue this month" value={dollars(metrics.currentMonthRevenueCents)} note="Paid invoices in the current calendar month" icon={CreditCard} tone="gold" />
          <MetricCard label="30-day churn" value={metrics.churnRate.toFixed(1) + "%"} note={`${metrics.canceled30} canceled · ${metrics.scheduledCancellation} scheduled`} icon={TrendingDown} tone="blue" />
          <MetricCard label="Average MRR / customer" value={dollars(metrics.averageRevenuePerCustomerCents, 2)} note={`${metrics.conversionRate.toFixed(1)}% user-to-paid conversion`} icon={CircleGauge} tone="green" />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Registered users" value={metrics.totalUsers.toLocaleString()} note={`${metrics.portfolioCount} started a portfolio`} icon={Users} tone="blue" />
          <MetricCard label="Published profiles" value={metrics.publishedProfiles.toLocaleString()} note={`${metrics.portfolioCount ? ((metrics.publishedProfiles / metrics.portfolioCount) * 100).toFixed(1) : "0.0"}% portfolio publish rate`} icon={LayoutDashboard} tone="orange" />
          <MetricCard label="30-day profile views" value={metrics.totalViews.toLocaleString()} note={`${metrics.totalVideoPlays.toLocaleString()} video plays`} icon={BarChart3} tone="gold" />
          <MetricCard label="Hosted video uploads" value={metrics.muxCounts.initiated.toLocaleString()} note={`${metrics.muxCounts.ready} ready · ${metrics.muxCounts.processing} processing · ${metrics.muxCounts.errored} errors`} icon={Film} tone="green" />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <section className="rounded-2xl border border-white/10 bg-[#0a151e] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8a69]">Platform engagement</p><h3 className="mt-2 text-xl font-black">Views and video plays</h3></div>
              <div className="flex gap-5 text-xs"><span><strong className="block text-lg text-[#ff8a69]">{metrics.totalViews}</strong><span className="text-white/30">Views</span></span><span><strong className="block text-lg text-amber-200">{metrics.totalVideoPlays}</strong><span className="text-white/30">Plays</span></span></div>
            </div>
            <div className="mt-8"><AnalyticsChart points={metrics.dailyAnalytics} /></div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0a151e] p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8a69]">Portfolio plan mix</p>
            <h3 className="mt-2 text-xl font-black">Entitlements</h3>
            <div className="mt-7 space-y-5">
              {planMix.map((plan) => (
                <div key={plan.label}>
                  <div className="flex items-center justify-between text-xs"><span className="text-white/55">{plan.label}</span><strong>{plan.count}</strong></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${plan.color}`} style={{ width: `${Math.min(100, (plan.count / totalPlans) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)]">
          <section className="rounded-2xl border border-white/10 bg-[#0a151e] p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8a69]">Gross revenue</p><h3 className="mt-2 text-xl font-black">Last six months</h3></div>
              <Activity className="h-5 w-5 text-white/25" />
            </div>
            <div className="mt-8 flex h-52 items-end gap-3">
              {metrics.monthlyRevenue.map((month) => (
                <div key={month.label} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                  <span className="mb-2 truncate text-center text-[10px] text-white/35">{dollars(month.cents)}</span>
                  <div className="rounded-t-md bg-[linear-gradient(to_top,#ff5a2f,#ff9c7e)]" style={{ height: `${Math.max(month.cents ? 6 : 0, (month.cents / maxRevenue) * 100)}%` }} />
                  <span className="mt-2 truncate text-center text-[10px] font-semibold uppercase text-white/30">{month.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0a151e] p-5 sm:p-6">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8a69]">Managed domains</p><h3 className="mt-2 text-xl font-black">Provisioning health</h3></div><Globe2 className="h-5 w-5 text-white/25" /></div>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {[
                ["Active", metrics.domainCounts.active, "text-emerald-200"],
                ["Purchasing", metrics.domainCounts.purchasing, "text-sky-200"],
                ["Failed", metrics.domainCounts.failed, "text-red-200"],
                ["Canceled", metrics.domainCounts.canceled, "text-white/45"],
              ].map(([label, value, color]) => (
                <div key={String(label)} className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <p className={`text-2xl font-black ${color}`}>{value}</p><p className="mt-1 text-xs text-white/35">{label}</p>
                </div>
              ))}
            </div>
            {metrics.domainCounts.failed > 0 && <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-100">Domain failures need manual review before the customer is considered fulfilled.</p>}
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a151e]">
          <div className="flex items-center justify-between border-b border-white/10 p-5">
            <div><h3 className="text-lg font-black">Recent paid invoices</h3><p className="mt-1 text-xs text-white/35">Latest successful Stripe payments</p></div>
            <CreditCard className="h-5 w-5 text-white/25" />
          </div>
          <div className="divide-y divide-white/[0.06]">
            {metrics.recentInvoices.map((invoice) => (
              <div key={invoice.id} className="grid gap-2 px-5 py-4 text-xs sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6">
                <div><p className="font-bold text-white/75">{invoice.email}</p><p className="mt-1 text-white/30">Invoice {invoice.number}</p></div>
                <p className="text-white/35">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                <p className="font-black text-emerald-200">{dollars(invoice.amountCents, 2)}</p>
              </div>
            ))}
            {metrics.recentInvoices.length === 0 && <p className="p-7 text-center text-sm text-white/35">No paid invoices yet.</p>}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a151e]">
          <AdminUserTable users={metrics.users} />
        </section>

        <footer className="flex flex-col justify-between gap-3 border-t border-white/10 py-5 text-xs text-white/25 sm:flex-row">
          <span>Diamond Profile internal operations</span>
          <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-white">Open Stripe <ArrowUpRight className="h-3 w-3" /></a>
        </footer>
      </div>
    </main>
  );
}
