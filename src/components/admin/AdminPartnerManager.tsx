"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, LoaderCircle, Plus, RefreshCw } from "lucide-react";

type Organization = {
  id: string;
  name: string;
  slug: string;
  partnership_type: "partner" | "white_label";
  status: "draft" | "active" | "suspended" | "canceled";
  billing_email: string | null;
  stripe_account_status: string;
  platform_subscription_status: string;
  billing_payment_method_ready: boolean;
  billing_sync_error: string | null;
  pro_wholesale_cents: number;
  elite_wholesale_cents: number;
  white_label_monthly_cents: number;
  wholesale_billing_exempt: boolean;
  wholesale_billing_exempt_reason: string | null;
  profile_domain: string | null;
  profile_domain_status: string;
  profile_domain_error: string | null;
  partner_memberships?: Array<{ id: string }>;
  players?: Array<{ id: string; partner_plan: string; partner_billing_status: string; is_published: boolean }>;
};

async function jsonRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, { ...options, headers: { "content-type": "application/json", ...(options?.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function AdminPartnerManager() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [connectConfig, setConnectConfig] = useState({ snapshotWebhookConfigured: false, thinWebhookConfigured: false });

  async function load() {
    setLoading(true);
    try {
      const [data, config] = await Promise.all([
        jsonRequest("/api/admin/partners"),
        jsonRequest("/api/admin/partners/stripe-connect-config"),
      ]);
      setOrganizations(data.organizations || []);
      setConnectConfig(config);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Partners could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);
  const totals = useMemo(() => ({
    active: organizations.filter((item) => item.status === "active").length,
    athletes: organizations.flatMap((item) => item.players || []).length,
    whiteLabel: organizations.filter((item) => item.partnership_type === "white_label").length,
  }), [organizations]);

  async function createPartner(form: FormData) {
    setBusy(true); setMessage("");
    try {
      const data = await jsonRequest("/api/admin/partners", { method: "POST", body: JSON.stringify({ name: form.get("name"), slug: form.get("slug"), ownerEmail: form.get("ownerEmail"), partnershipType: form.get("partnershipType") }) });
      setMessage(data.invited ? "Partner created and owner invitation sent." : "Partner created and connected to the existing owner account.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Partner creation failed.");
    } finally { setBusy(false); }
  }

  async function updatePartner(id: string, values: Record<string, unknown>) {
    setBusy(true); setMessage("");
    try {
      const data = await jsonRequest("/api/admin/partners", { method: "PATCH", body: JSON.stringify({ id, ...values }) });
      setMessage(data.billingWarning ? `Partner updated. Billing needs attention: ${data.billingWarning}` : "Partner and wholesale billing updated.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Partner update failed.");
    } finally { setBusy(false); }
  }

  async function bootstrapConnect() {
    setBusy(true); setMessage("");
    try {
      const data = await jsonRequest("/api/admin/partners/stripe-connect-bootstrap", { method: "POST" });
      setMessage(data.needsRedeploy
        ? "Stripe Connect webhooks were created and installed in Vercel. Redeploy production once to activate them."
        : "Stripe Connect webhooks are already configured.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Stripe Connect webhooks could not be configured.");
    } finally { setBusy(false); }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a151e]">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff8a69]">Reseller operations</p><h3 className="mt-2 text-xl font-black">Partners and white labels</h3></div>
        <div className="flex gap-4 text-xs text-white/40"><span><strong className="block text-lg text-white">{totals.active}</strong>Active</span><span><strong className="block text-lg text-white">{totals.athletes}</strong>Athletes</span><span><strong className="block text-lg text-white">{totals.whiteLabel}</strong>White label</span></div>
      </div>
      <form action={createPartner} className="grid gap-3 border-b border-white/10 bg-white/[.02] p-5 md:grid-cols-[1fr_180px_1fr_160px_auto]">
        <input name="name" required placeholder="Organization name" className="rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none" />
        <input name="slug" required placeholder="workspace-slug" pattern="[a-z0-9-]+" className="rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none" />
        <input name="ownerEmail" required type="email" placeholder="Owner email" className="rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none" />
        <select name="partnershipType" className="rounded-lg border border-white/10 bg-[#0a151e] px-3 py-3 text-sm"><option value="partner">Partner</option><option value="white_label">White label</option></select>
        <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e5162a] px-5 text-sm font-black disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Create</button>
      </form>
      {message && <p className="border-b border-white/10 px-5 py-3 text-xs text-white/65">{message}</p>}
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-white/35">Stripe Connect infrastructure</p><div className="mt-3 flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase ${connectConfig.snapshotWebhookConfigured ? "bg-emerald-300/10 text-emerald-200" : "bg-red-300/10 text-red-200"}`}>Payments webhook {connectConfig.snapshotWebhookConfigured ? "active" : "missing"}</span><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase ${connectConfig.thinWebhookConfigured ? "bg-emerald-300/10 text-emerald-200" : "bg-red-300/10 text-red-200"}`}>Account webhook {connectConfig.thinWebhookConfigured ? "active" : "missing"}</span><span className="rounded-full bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold uppercase text-emerald-200">V2 Account Links active</span></div></div>
        {(!connectConfig.snapshotWebhookConfigured || !connectConfig.thinWebhookConfigured) && <button type="button" disabled={busy} onClick={() => void bootstrapConnect()} className="shrink-0 rounded-lg bg-white px-4 py-3 text-xs font-black text-black disabled:opacity-50">Configure webhooks</button>}
      </div>
      {loading ? <p className="flex items-center justify-center gap-2 p-10 text-sm text-white/35"><LoaderCircle className="h-4 w-4 animate-spin" />Loading partners</p> : (
        <div className="divide-y divide-white/[.06]">
          {organizations.map((organization) => {
            const activeAthletes = (organization.players || []).filter((player) => ["trialing", "active", "past_due", "canceling"].includes(player.partner_billing_status)).length;
            return <article key={organization.id} className="grid gap-5 p-5 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="flex min-w-0 gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5"><Building2 className="h-4 w-4 text-white/45" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="truncate">{organization.name}</strong><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-bold uppercase text-white/45">{organization.partnership_type.replace("_", " ")}</span>{organization.wholesale_billing_exempt && <span className="rounded-full bg-violet-300/10 px-2 py-1 text-[10px] font-bold uppercase text-violet-200">complimentary test</span>}<span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${organization.status === "active" ? "bg-emerald-300/10 text-emerald-200" : "bg-white/5 text-white/40"}`}>{organization.status}</span></div><p className="mt-1 text-xs text-white/35">{organization.billing_email} · {activeAthletes} active athlete seats · Stripe {organization.stripe_account_status}</p>{organization.profile_domain && <p className="mt-1 text-xs text-white/35">White-label domain: {organization.profile_domain} · {organization.profile_domain_status}</p>}{organization.billing_sync_error && <p className="mt-2 text-xs text-red-200">Billing: {organization.billing_sync_error}</p>}{organization.profile_domain_error && <p className="mt-2 text-xs text-red-200">Domain: {organization.profile_domain_error}</p>}</div></div>
              <div className="flex flex-wrap gap-2">
                <a href={`/partner/${organization.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/60 hover:text-white">Open workspace</a>
                <select disabled={busy} value={organization.partnership_type} onChange={(event) => void updatePartner(organization.id, { partnershipType: event.target.value })} className="rounded-lg border border-white/10 bg-[#0a151e] px-3 py-2 text-xs font-bold"><option value="partner">Partner $8/$12</option><option value="white_label">White label $4/$6 + $200</option></select>
                <select disabled={busy} value={organization.status} onChange={(event) => void updatePartner(organization.id, { status: event.target.value })} className="rounded-lg border border-white/10 bg-[#0a151e] px-3 py-2 text-xs font-bold"><option value="draft">Draft</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="canceled">Canceled</option></select>
              </div>
            </article>;
          })}
          {organizations.length === 0 && <p className="p-10 text-center text-sm text-white/35">No partners yet. Create the first organization above.</p>}
        </div>
      )}
      <button onClick={() => void load()} className="m-5 inline-flex items-center gap-2 text-xs font-bold text-white/35 hover:text-white"><RefreshCw className="h-3 w-3" />Refresh</button>
    </section>
  );
}
